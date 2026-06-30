import yaml
from django.test import TestCase, override_settings
from pathlib import Path
from tempfile import TemporaryDirectory


class OpenAPIDocumentationTests(TestCase):
    def test_schema_and_documentation_are_served(self):
        schema_response = self.client.get("/api/v1/schema/")
        swagger_response = self.client.get("/api/v1/docs/")
        redoc_response = self.client.get("/api/v1/redoc/")

        self.assertEqual(schema_response.status_code, 200)
        self.assertEqual(swagger_response.status_code, 200)
        self.assertEqual(redoc_response.status_code, 200)

        schema = yaml.safe_load(schema_response.content)
        self.assertIn("/api/v1/applications/", schema["paths"])
        self.assertIn("/api/v1/auth/login/", schema["paths"])

        reset_confirm = schema["paths"]["/api/v1/auth/password/reset/{uid}/{token}/"]["post"]
        request_schema = reset_confirm["requestBody"]["content"]["application/json"]["schema"]
        component_name = request_schema["$ref"].rsplit("/", 1)[-1]
        request_properties = schema["components"]["schemas"][component_name]["properties"]
        self.assertEqual(
            set(request_properties),
            {"new_password", "new_password_confirm"},
        )

    def test_schema_documents_frontend_contracts_precisely(self):
        response = self.client.get("/api/v1/schema/")
        self.assertEqual(response.status_code, 200)
        schema = yaml.safe_load(response.content)

        error_schema = schema["components"]["schemas"]["Error"]
        self.assertIn("errors", error_schema["required"])
        self.assertEqual(error_schema["properties"]["errors"]["type"], "object")
        self.assertTrue(error_schema["properties"]["errors"]["nullable"])

        attachment = schema["paths"]["/api/v1/applications/{id}/attachment/"]["get"]
        self.assertIn(
            "application/octet-stream",
            attachment["responses"]["200"]["content"],
        )
        self.assertNotIn(
            "application/json",
            attachment["responses"]["200"]["content"],
        )

        reset_request = schema["paths"]["/api/v1/auth/password/reset/"]["post"]
        reset_response = reset_request["responses"]["202"]["content"]["application/json"]["schema"]
        self.assertEqual(reset_response["$ref"], "#/components/schemas/Detail")

        unread_count = schema["paths"]["/api/v1/notifications/unread-count/"]["get"]
        unread_response = unread_count["responses"]["200"]["content"]["application/json"]["schema"]
        self.assertEqual(unread_response["$ref"], "#/components/schemas/UnreadCount")

        read_all = schema["paths"]["/api/v1/notifications/read-all/"]["post"]
        read_all_response = read_all["responses"]["200"]["content"]["application/json"]["schema"]
        self.assertEqual(read_all_response["$ref"], "#/components/schemas/MarkAllRead")


class SPAIntegrationTests(TestCase):
    def test_client_side_routes_serve_the_frontend_index(self):
        with TemporaryDirectory() as directory:
            index_path = Path(directory) / "index.html"
            index_path.write_text("<html><body>CaseMan</body></html>")
            with override_settings(FRONTEND_INDEX_PATH=index_path):
                response = self.client.get("/applications/42")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"CaseMan", b"".join(response.streaming_content))

    def test_missing_frontend_build_has_an_actionable_response(self):
        with override_settings(FRONTEND_INDEX_PATH="/does/not/exist/index.html"):
            response = self.client.get("/login")

        self.assertEqual(response.status_code, 503)
        self.assertIn(b"npm run build", response.content)
