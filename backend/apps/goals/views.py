from datetime import date

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.helpers import create_notification
from .models import GoalContribution, SavingsGoal
from .serializers import ContributionSerializer, GoalSerializer


def make_info(goal):
    target = float(goal.target_amount)
    saved = float(goal.saved_amount)
    percent = round(saved / target * 100, 1)

    deadline = None
    if goal.deadline is not None:
        deadline = str(goal.deadline)

    return {
        'id': goal.id,
        'name': goal.name,
        'target_amount': target,
        'saved_amount': saved,
        'remaining': round(max(target - saved, 0), 2),
        'percent_saved': percent,
        'deadline': deadline,
        'status': goal.status,
    }


def refresh_status(goal):
    if goal.saved_amount >= goal.target_amount:
        goal.status = 'completed'
        if goal.completed_at is None:
            goal.completed_at = timezone.now()
    else:
        goal.status = 'active'
        goal.completed_at = None
    goal.save()


# def send_goal_notifications(goal, old_saved):
#     target = float(goal.target_amount)
#     old_percent = float(old_saved) / target * 100
#     new_percent = float(goal.saved_amount) / target * 100

#     if goal.status == 'completed':
#         title = 'Goal completed: ' + goal.name
#         message = 'Congratulations! You reached your target of ₹' + str(target) + ' for "' + goal.name + '".'
#         create_notification(goal.user, 'goal_milestone', title, message)

#     elif old_percent < 50 and new_percent >= 50:
#         title = 'Halfway there: ' + goal.name
#         message = 'You have saved ' + str(round(new_percent, 1)) + '% of "' + goal.name + '". Keep going!'
#         create_notification(goal.user, 'goal_milestone', title, message)

def send_goal_notifications(goal, old_saved):
    target = float(goal.target_amount)
    old_percent = float(old_saved) / target * 100
    new_percent = float(goal.saved_amount) / target * 100

    target_text = f'{target:.2f}'
    saved_text = f'{float(goal.saved_amount):.2f}'

    if goal.status == 'completed':
        title = 'Goal completed: ' + goal.name
        message = 'Congratulations! You reached your target of ₹' + target_text + ' for "' + goal.name + '". You have saved ₹' + saved_text + '.'
        create_notification(goal.user, 'goal_milestone', title, message)

    elif old_percent < 50 and new_percent >= 50:
        title = 'Halfway there: ' + goal.name
        message = 'You have saved ₹' + saved_text + ' of ₹' + target_text + ' (' + str(round(new_percent, 1)) + '%) for "' + goal.name + '". Keep going!'
        create_notification(goal.user, 'goal_milestone', title, message)


class GoalView(APIView):

    def get(self, request):
        goals = SavingsGoal.objects.filter(user=request.user).order_by('status', '-id')

        result = []
        for goal in goals:
            result.append(make_info(goal))
        return Response(result)

    def post(self, request):
        serializer = GoalSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        goal = serializer.save(user=request.user)
        return Response(make_info(goal), status=status.HTTP_201_CREATED)


class GoalDetailView(APIView):

    def find_goal(self, request, pk):
        return SavingsGoal.objects.filter(id=pk, user=request.user).first()

    def put(self, request, pk):
        goal = self.find_goal(request, pk)
        if goal is None:
            return Response({'error': 'Goal not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = GoalSerializer(goal, data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        goal = serializer.save()
        refresh_status(goal)
        return Response(make_info(goal))

    def delete(self, request, pk):
        goal = self.find_goal(request, pk)
        if goal is None:
            return Response({'error': 'Goal not found.'}, status=status.HTTP_404_NOT_FOUND)

        goal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class GoalMoneyView(APIView):

    def find_goal(self, request, pk):
        return SavingsGoal.objects.filter(id=pk, user=request.user).first()

    def get(self, request, pk):
        goal = self.find_goal(request, pk)
        if goal is None:
            return Response({'error': 'Goal not found.'}, status=status.HTTP_404_NOT_FOUND)

        contributions = GoalContribution.objects.filter(goal=goal).order_by('-date', '-id')

        result = []
        for item in contributions:
            result.append({
                'id': item.id,
                'amount': float(item.amount),
                'date': str(item.date),
            })
        return Response(result)

    def post(self, request, pk):
        goal = self.find_goal(request, pk)
        if goal is None:
            return Response({'error': 'Goal not found.'}, status=status.HTTP_404_NOT_FOUND)

        if goal.status == 'completed':
            return Response(
                {'error': 'This goal is already completed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ContributionSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']

        #######                If we added more than the target           ########
        still_needed = goal.target_amount - goal.saved_amount
        if amount > still_needed:
            return Response(
                {'error': 'You only need ₹' + str(still_needed) + ' more to reach this goal.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        money_date = serializer.validated_data.get('date', date.today())

        old_saved = goal.saved_amount

        GoalContribution.objects.create(goal=goal, amount=amount, date=money_date)

        goal.saved_amount = goal.saved_amount + amount
        refresh_status(goal)
        send_goal_notifications(goal, old_saved)

        return Response(make_info(goal))