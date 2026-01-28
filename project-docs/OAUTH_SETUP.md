# OAuth Setup Instructions

To enable Google and GitHub authentication, you need to create OAuth applications on their respective platforms and add the credentials to the `.env` file.

## Google OAuth

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project or select an existing one.
3.  Go to **APIs & Services > Credentials**.
4.  Click **Create Credentials > OAuth client ID**.
5.  Select **Web application** as the application type.
6.  Add `http://localhost:5000` to the **Authorized JavaScript origins**.
7.  Add `http://localhost:5000/api/auth/google/callback` to the **Authorized redirect URIs**.
8.  Click **Create**.
9.  Copy the **Client ID** and **Client Secret** and add them to the `.env` file as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## GitHub OAuth

1.  Go to your [GitHub Developer settings](https://github.com/settings/developers).
2.  Click **New OAuth App**.
3.  Enter an **Application name** (e.g., "Hiring Predictor").
4.  Enter `http://localhost:5000` for the **Homepage URL**.
5.  Enter `http://localhost:5000/api/auth/github/callback` for the **Authorization callback URL**.
6.  Click **Register application**.
7.  Copy the **Client ID** and **Client Secret** and add them to the `.env` file as `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
