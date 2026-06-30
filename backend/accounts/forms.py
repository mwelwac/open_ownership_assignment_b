from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from .models import User


class CustomUserCreationForm(UserCreationForm):
    """Admin 'add user' form, keyed on email instead of username.

    Inherits the password1/password2 fields from UserCreationForm; the
    model's save() backfills `username` from `email`, so it is omitted here.
    """

    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('email', 'first_name', 'last_name', 'role')


class CustomUserChangeForm(UserChangeForm):
    """Admin 'change user' form, bound to the custom User model.

    Keeps UserChangeForm's read-only password hash field; the displayed
    fields are driven by UserAdmin.fieldsets.
    """

    class Meta(UserChangeForm.Meta):
        model = User
        fields = '__all__'
