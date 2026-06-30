import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Application",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=255)),
                ("category", models.CharField(choices=[("NAME_CLEARANCE", "Name Clearance"), ("INCORPORATION", "Incorporation"), ("BO_DECLARATION", "Business Ownership Declaration"), ("DETAILS_UPDATE", "Details Update")], max_length=32)),
                ("description", models.TextField(blank=True)),
                ("amount", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("attachment", models.FileField(blank=True, null=True, upload_to="attachments/")),
                ("status", models.CharField(choices=[("DRAFT", "Draft"), ("SUBMITTED", "Submitted"), ("UNDER_REVIEW", "Under review"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], default="DRAFT", max_length=20)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="applications", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="StatusTransition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("from_status", models.CharField(blank=True, choices=[("DRAFT", "Draft"), ("SUBMITTED", "Submitted"), ("UNDER_REVIEW", "Under review"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], max_length=20)),
                ("to_status", models.CharField(choices=[("DRAFT", "Draft"), ("SUBMITTED", "Submitted"), ("UNDER_REVIEW", "Under review"), ("APPROVED", "Approved"), ("REJECTED", "Rejected")], max_length=20)),
                ("comment", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("actor", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="transitions_performed", to=settings.AUTH_USER_MODEL)),
                ("application", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transitions", to="applications.application")),
            ],
            options={"ordering": ["created_at"]},
        ),
    ]
