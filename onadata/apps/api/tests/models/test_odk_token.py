"""
Test ODK Token module
"""
from datetime import timedelta

from onadata.apps.api.models.odk_token import ODKToken, ODK_TOKEN_LIFETIME
from onadata.apps.api.tests.models.test_abstract_models import \
    TestAbstractModels


class TestODKToken(TestAbstractModels):
    def test_create_odk_token(self):
        """
        Test that ODK Tokens can be created
        """
        self._create_user_and_login()
        initial_count = ODKToken.objects.count()

        token = ODKToken.objects.create(user=self.user)

        self.assertEqual(initial_count + 1, ODKToken.objects.count())
        self.assertEqual(
            token.expires,
            token.created + timedelta(days=ODK_TOKEN_LIFETIME))
