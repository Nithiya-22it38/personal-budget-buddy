from django.test import TestCase
from rest_framework.test import APIClient

from .models import User


class AuthTests(TestCase):

    def setUp(self):
        self.api = APIClient()

    def test_register_creates_a_student(self):
        response = self.api.post('/api/auth/register/', {
            'username': 'ravi',
            'email': 'ravi@example.com',
            'password': 'test1234',
        }, format='json')

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(username='ravi')
        self.assertEqual(user.role, 'student')

    def test_password_is_stored_as_a_hash(self):
        self.api.post('/api/auth/register/', {
            'username': 'ravi',
            'email': 'ravi@example.com',
            'password': 'test1234',
        }, format='json')

        user = User.objects.get(username='ravi')
        self.assertNotEqual(user.password, 'test1234')
        self.assertTrue(user.check_password('test1234'))

    def test_cannot_register_as_admin(self):
        self.api.post('/api/auth/register/', {
            'username': 'sneaky',
            'email': 'sneaky@example.com',
            'password': 'test1234',
            'role': 'admin',
        }, format='json')

        user = User.objects.get(username='sneaky')
        self.assertEqual(user.role, 'student')

    def test_duplicate_username_is_rejected(self):
        User.objects.create_user(username='ravi', email='ravi@example.com', password='test1234')

        response = self.api.post('/api/auth/register/', {
            'username': 'ravi',
            'email': 'other@example.com',
            'password': 'test1234',
        }, format='json')

        self.assertEqual(response.status_code, 400)

    def test_login_and_me_with_token(self):
        User.objects.create_user(username='ravi', email='ravi@example.com', password='test1234')

        login = self.api.post('/api/auth/login/', {
            'username': 'ravi',
            'password': 'test1234',
        }, format='json')
        self.assertEqual(login.status_code, 200)

        token = login.data['access']
        self.api.credentials(HTTP_AUTHORIZATION='Bearer ' + token)

        me = self.api.get('/api/auth/me/')
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data['username'], 'ravi')

    def test_me_without_token_is_refused(self):
        response = self.api.get('/api/auth/me/')
        self.assertEqual(response.status_code, 401)