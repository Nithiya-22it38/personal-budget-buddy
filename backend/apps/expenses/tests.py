from django.test import TestCase
from rest_framework.test import APIClient

from apps.authentication.models import User
from apps.categories.models import Category
from .models import Expense


class ExpenseTests(TestCase):

    def setUp(self):
        self.api = APIClient()
        self.ravi = User.objects.create_user(username='ravi', email='ravi@example.com', password='test1234')
        self.meena = User.objects.create_user(username='meena', email='meena@example.com', password='test1234')
        self.food = Category.objects.create(name='Food', user=None)

    def test_student_can_add_and_list_an_expense(self):
        self.api.force_authenticate(user=self.ravi)

        response = self.api.post('/api/expenses/', {
            'category_id': self.food.id,
            'amount': 120,
            'date': '2026-11-17',
            'note': 'Lunch',
        }, format='json')
        self.assertEqual(response.status_code, 201)

        listing = self.api.get('/api/expenses/')
        self.assertEqual(len(listing.data), 1)
        self.assertEqual(listing.data[0]['category_name'], 'Food')

    def test_negative_amount_is_rejected(self):
        self.api.force_authenticate(user=self.ravi)

        response = self.api.post('/api/expenses/', {
            'category_id': self.food.id,
            'amount': -5,
            'date': '2026-11-17',
        }, format='json')

        self.assertEqual(response.status_code, 400)

    def test_student_cannot_see_another_students_expense(self):
        expense = Expense.objects.create(
            user=self.ravi,
            category=self.food,
            amount=100,
            date='2026-11-17',
        )

        self.api.force_authenticate(user=self.meena)

        listing = self.api.get('/api/expenses/')
        self.assertEqual(len(listing.data), 0)

        detail = self.api.get('/api/expenses/' + str(expense.id) + '/')
        self.assertEqual(detail.status_code, 404)

    def test_login_is_required(self):
        response = self.api.get('/api/expenses/')
        self.assertEqual(response.status_code, 401)