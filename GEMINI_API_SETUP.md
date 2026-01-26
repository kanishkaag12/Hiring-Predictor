# 🚀 Enable Real-Time AI Responses (Gemini API)

Your What-If Simulator currently uses **mock data**. To get **real-time AI-powered answers**, follow these steps:

## Step 1: Get Your Gemini API Key

1. **Go to:** https://aistudio.google.com/app/apikeys
2. **Sign in** with your Google account (create one if needed)
3. **Click:** "Create API Key" → "Create API key in new project"
4. **Copy** the API key (it starts with `AI...`)

## Step 2: Add to .env File

Open `C:\Hiring-Predictor\.env` and find this line:

```env
GEMINI_API_KEY=
```

Add your API key:

```env
GEMINI_API_KEY=AIzaSyDxxx_your_actual_key_here_xxxx
```

## Step 3: Restart Server

Stop the current server and restart:

```powershell
npm run dev
```

## Step 4: Test It!

1. Open: http://localhost:3001/app/jobs
2. Click on a job → "What-If Simulator"
3. Ask: "How much would learning Docker help?"
4. You should now get **real AI-generated answers** instead of mock data!

---

## ✅ How to Know It's Working

- **Real-Time Mode:** Backend logs show "Using Gemini API"
- **Mock Mode:** Backend logs show "Using mock response"
- **Answers change:** Each question gets a unique AI-generated response
- **Personalized:** Responses reference the specific job title

---

## 🔍 Verify Your Setup

Check the backend console when you ask a question:
- If you see `Using Gemini API` → ✅ Real-time (enabled)
- If you see `Using mock response` → ⚠️ Still mock mode (no API key)

---

## 📝 Free API Limits

Google's Gemini API has **free tier limits**:
- ✅ Up to 60 requests per minute
- ✅ Perfect for testing and small projects
- 💳 Paid plans available for higher volume

---

## 🆘 Troubleshooting

### API Key Not Working?
- Check for extra spaces in .env file
- Ensure the entire key is copied
- Verify you're on the free tier (not a billing issue)

### Still Getting Mock Responses?
- Restart the server after changing .env
- Check `node_modules` - run `npm install` if it changed

### Rate Limited?
- Wait a minute before making new requests
- Or upgrade to a paid plan

---

**Last Updated:** January 26, 2026
