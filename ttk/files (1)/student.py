"""
student.py
----------
Model layer for Student records. Contains:
  - Validation helpers (phone, email, required fields)
  - StudentModel class: all CRUD operations against the `students` table
  - Register ID auto-generation logic (starts at 1000, increments per student)

No Tkinter code lives here — this keeps the model reusable/testable and
keeps the project's MVC separation clean.
"""

import re
from datetime import datetime

# Course types available in the dropdown, exactly as required by the spec.
COURSE_TYPES = [
    "Slash Course (1 Month)",
    "Crash Course (1.5 Months)",
    "Professional Course",
    "Tesbo Course",
    "ThoorigAI Course - Course",
    "ThoorigAI Course - Internship",
]

PHONE_REGEX = re.compile(r"^\d{10}$")
EMAIL_REGEX = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


class ValidationError(Exception):
    """Raised when student input data fails validation."""
    pass


def validate_phone(phone):
    """Phone number must be exactly 10 digits."""
    if not phone or not PHONE_REGEX.match(phone.strip()):
        raise ValidationError("Phone number must be exactly 10 digits.")
    return phone.strip()


def validate_email(email):
    """Basic but robust email format validation."""
    email = (email or "").strip()
    if not email or not EMAIL_REGEX.match(email):
        raise ValidationError("Please enter a valid email address.")
    return email


def validate_required(value, field_name):
    """Generic 'cannot be empty' validator."""
    if value is None or str(value).strip() == "":
        raise ValidationError(f"{field_name} is required and cannot be empty.")
    return str(value).strip()


def validate_amount(value, field_name):
    """Validates that a fee amount is a non-negative number."""
    try:
        amount = float(value)
    except (TypeError, ValueError):
        raise ValidationError(f"{field_name} must be a valid number.")
    if amount < 0:
        raise ValidationError(f"{field_name} cannot be negative.")
    return amount


class StudentModel:
    """All database operations related to Students."""

    def __init__(self, db):
        self.db = db

    # ------------------------------------------------------------------
    # Register ID generation
    # ------------------------------------------------------------------
    def get_next_register_id(self):
        """
        Returns the next register ID (starting at 1000) WITHOUT consuming it.
        The counter is only advanced once a student is actually inserted
        (see _advance_register_id), so repeatedly opening the Add Student
        form does not burn IDs.
        """
        row = self.db.fetch_one("SELECT value FROM settings WHERE key = 'next_register_id'")
        return int(row["value"]) if row else 1000

    def _advance_register_id(self, current_id):
        """Persists the next register id counter after a successful insert."""
        self.db.execute(
            "UPDATE settings SET value = ? WHERE key = 'next_register_id'",
            (str(current_id + 1),)
        )

    # ------------------------------------------------------------------
    # CREATE
    # ------------------------------------------------------------------
    def add_student(self, data):
        """
        Validates and inserts a new student record.
        `data` is expected to be a dict with raw form values (strings).
        Returns the generated register_id on success.
        Raises ValidationError on bad input.
        """
        name = validate_required(data.get("student_name"), "Student Name")
        qualification = (data.get("qualification") or "").strip()
        phone = validate_phone(data.get("phone"))
        email = validate_email(data.get("email"))
        course_name = validate_required(data.get("course_name"), "Course Name")
        course_type = validate_required(data.get("course_type"), "Course Type")
        total_fees = validate_amount(data.get("total_fees"), "Total Fees")
        paid_amount = validate_amount(data.get("paid_amount"), "Paid Amount")

        if paid_amount > total_fees:
            raise ValidationError("Paid Amount cannot be greater than Total Fees.")

        balance_fees = round(total_fees - paid_amount, 2)
        payment_status = "Fully Paid" if balance_fees <= 0 else "Pending"

        register_id = self.get_next_register_id()
        admission_date = datetime.now().strftime("%Y-%m-%d")

        batch_start_date = (data.get("batch_start_date") or "").strip()
        faculty_name = (data.get("faculty_name") or "").strip()

        self.db.execute("""
            INSERT INTO students (
                register_id, admission_date, student_name, qualification,
                phone, email, course_name, course_type, total_fees,
                paid_amount, balance_fees, batch_start_date, faculty_name,
                payment_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            register_id, admission_date, name, qualification, phone, email,
            course_name, course_type, total_fees, paid_amount, balance_fees,
            batch_start_date, faculty_name, payment_status
        ))

        # Only advance the counter after a successful insert.
        self._advance_register_id(register_id)
        return register_id

    # ------------------------------------------------------------------
    # READ
    # ------------------------------------------------------------------
    def get_all_students(self):
        """Returns all students ordered by register_id."""
        return self.db.fetch_all("SELECT * FROM students ORDER BY register_id ASC")

    def get_student_by_register_id(self, register_id):
        """Returns a single student row or None."""
        return self.db.fetch_one(
            "SELECT * FROM students WHERE register_id = ?", (register_id,)
        )

    def search_students(self, keyword):
        """
        Searches students by register_id, name, phone, or email.
        Performs a case-insensitive partial match using LIKE.
        """
        keyword = f"%{keyword.strip()}%"
        return self.db.fetch_all("""
            SELECT * FROM students
            WHERE CAST(register_id AS TEXT) LIKE ?
               OR student_name LIKE ?
               OR phone LIKE ?
               OR email LIKE ?
            ORDER BY register_id ASC
        """, (keyword, keyword, keyword, keyword))

    def filter_students(self, course_type=None, payment_status=None):
        """
        Returns students filtered by course_type and/or payment_status.
        Pass None (or "All") to skip a filter.
        """
        query = "SELECT * FROM students WHERE 1=1"
        params = []
        if course_type and course_type != "All":
            query += " AND course_type = ?"
            params.append(course_type)
        if payment_status and payment_status != "All":
            query += " AND payment_status = ?"
            params.append(payment_status)
        query += " ORDER BY register_id ASC"
        return self.db.fetch_all(query, tuple(params))

    def get_fully_paid_students(self):
        """Returns only students eligible for certificates (balance == 0)."""
        return self.db.fetch_all(
            "SELECT * FROM students WHERE balance_fees <= 0 ORDER BY register_id ASC"
        )

    # ------------------------------------------------------------------
    # UPDATE
    # ------------------------------------------------------------------
    def update_student(self, register_id, data):
        """
        Updates an existing student's editable fields.
        Recalculates balance_fees/payment_status if fee fields changed.
        """
        existing = self.get_student_by_register_id(register_id)
        if not existing:
            raise ValidationError("Student record not found.")

        name = validate_required(data.get("student_name"), "Student Name")
        qualification = (data.get("qualification") or "").strip()
        phone = validate_phone(data.get("phone"))
        email = validate_email(data.get("email"))
        course_name = validate_required(data.get("course_name"), "Course Name")
        course_type = validate_required(data.get("course_type"), "Course Type")
        total_fees = validate_amount(data.get("total_fees"), "Total Fees")
        paid_amount = validate_amount(data.get("paid_amount"), "Paid Amount")

        if paid_amount > total_fees:
            raise ValidationError("Paid Amount cannot be greater than Total Fees.")

        balance_fees = round(total_fees - paid_amount, 2)
        payment_status = "Fully Paid" if balance_fees <= 0 else "Pending"

        batch_start_date = (data.get("batch_start_date") or "").strip()
        faculty_name = (data.get("faculty_name") or "").strip()

        self.db.execute("""
            UPDATE students SET
                student_name = ?, qualification = ?, phone = ?, email = ?,
                course_name = ?, course_type = ?, total_fees = ?,
                paid_amount = ?, balance_fees = ?, batch_start_date = ?,
                faculty_name = ?, payment_status = ?
            WHERE register_id = ?
        """, (
            name, qualification, phone, email, course_name, course_type,
            total_fees, paid_amount, balance_fees, batch_start_date,
            faculty_name, payment_status, register_id
        ))
        return True

    def update_batch_info(self, register_id, batch_start_date, faculty_name):
        """Quick update used by the 'View All Students' grid for batch/faculty info."""
        self.db.execute("""
            UPDATE students SET batch_start_date = ?, faculty_name = ?
            WHERE register_id = ?
        """, (batch_start_date.strip(), faculty_name.strip(), register_id))

    def apply_payment(self, register_id, additional_paid_amount):
        """
        Applies a new payment to a student record:
          new_paid = old_paid + additional_paid_amount
          new_balance = total_fees - new_paid
        Returns (new_paid_amount, new_balance, payment_status).
        """
        student = self.get_student_by_register_id(register_id)
        if not student:
            raise ValidationError("Student record not found.")

        new_paid = round(student["paid_amount"] + additional_paid_amount, 2)
        total_fees = student["total_fees"]

        if new_paid > total_fees:
            raise ValidationError(
                f"Payment exceeds total fees. Maximum payable amount is "
                f"{total_fees - student['paid_amount']:.2f}."
            )

        new_balance = round(total_fees - new_paid, 2)
        payment_status = "Fully Paid" if new_balance <= 0 else "Pending"

        self.db.execute("""
            UPDATE students SET paid_amount = ?, balance_fees = ?, payment_status = ?
            WHERE register_id = ?
        """, (new_paid, new_balance, payment_status, register_id))

        return new_paid, new_balance, payment_status

    # ------------------------------------------------------------------
    # DELETE
    # ------------------------------------------------------------------
    def delete_student(self, register_id):
        """Deletes a student (and their payment history, via cascade)."""
        existing = self.get_student_by_register_id(register_id)
        if not existing:
            raise ValidationError("Student record not found.")
        self.db.execute("DELETE FROM payments WHERE register_id = ?", (register_id,))
        self.db.execute("DELETE FROM students WHERE register_id = ?", (register_id,))
        return True
