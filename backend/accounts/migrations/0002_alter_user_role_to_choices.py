from django.db import migrations, models


def convert_role_ids_to_codes(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    User = apps.get_model("accounts", "User")
    HistoricalUser = apps.get_model("accounts", "HistoricalUser")
    role_codes = dict(Role.objects.values_list("id", "code"))

    for model in (User, HistoricalUser):
        for record in model.objects.all().only("pk", "role").iterator():
            value = record.role
            if value in {"APPLICANT", "REVIEWER"}:
                continue
            code = role_codes.get(int(value)) if value and value.isdigit() else None
            record.role = code if code in {"APPLICANT", "REVIEWER"} else "APPLICANT"
            record.save(update_fields=("role",))


def convert_role_codes_to_ids(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    User = apps.get_model("accounts", "User")
    HistoricalUser = apps.get_model("accounts", "HistoricalUser")
    role_ids = dict(Role.objects.values_list("code", "id"))

    for model in (User, HistoricalUser):
        for record in model.objects.all().only("pk", "role").iterator():
            record.role = str(role_ids.get(record.role, "")) or None
            record.save(update_fields=("role",))


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="historicaluser",
            name="role",
            field=models.CharField(
                choices=[("APPLICANT", "Applicant"), ("REVIEWER", "Reviewer")],
                default="APPLICANT",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[("APPLICANT", "Applicant"), ("REVIEWER", "Reviewer")],
                default="APPLICANT",
                max_length=20,
            ),
        ),
        migrations.RunPython(convert_role_ids_to_codes, convert_role_codes_to_ids),
    ]
