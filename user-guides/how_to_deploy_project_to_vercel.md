# Vercel Deployment Guide for Agent

> 💡 **Quick Start**: Simply drag and drop this file to the Agent, and it will guide you through the entire Vercel deployment process!

This guide provides **STRICT** step-by-step instructions for AI agents to deploy Next.js applications to Vercel. **AGENTS MUST FOLLOW THIS GUIDE EXACTLY**.

## 🚨 CRITICAL REQUIREMENTS

### 📁 **PROJECT DIRECTORY REQUIREMENT**
- **MANDATORY**: Agent MUST deploy from the **LOCAL PROJECT DIRECTORY** in workspace
- **PROJECT PATH**: `{workspace}/{YOUR_PROJECT_NAME}/` (or user-specified project folder)
- **NEVER**: Search for existing Vercel projects online
- **NEVER**: Use `vercel ls` to find projects - use the local directory provided
- **ALWAYS**: Execute all commands from within the project directory: `cd {YOUR_PROJECT_NAME}`

### 🔑 **TOKEN REQUIREMENT**
- **Required**: User-provided Vercel token
- **Format**: String like `ko9mUif7ZoVzTc5yKIfdmm99`
- **Usage**: Add `--token {USER_PROVIDED_TOKEN}` to ALL vercel commands

## 🤖 AGENT EXECUTION FLOW (STRICT ORDER)

### **PHASE 1: PREPARATION & VERIFICATION**

#### Step 1: Token Verification
```bash
npx vercel whoami --token {USER_PROVIDED_TOKEN}
```
**Expected**: Username output
**On Failure**: STOP execution, request valid token from user

#### Step 2: Navigate to Project Directory
```bash
cd {YOUR_PROJECT_NAME}  # e.g., cd my-nextjs-app
```
**CRITICAL**: ALL subsequent commands MUST be executed from project directory

#### Step 3: Build Project
```bash
npm run build
```
**On Warning**: Continue (warnings acceptable)
**On Error**: STOP execution, fix build issues first

### **PHASE 2: CONFIGURATION OPTIMIZATION (PREEMPTIVE)**

#### Step 4: Create vercel.json (MANDATORY - Prevents 401 Issues)
```bash
# Create vercel.json to prevent deployment protection issues
cat > vercel.json << 'EOF'
{
  "public": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
EOF
```
**Purpose**: Prevents HTTP 401 deployment protection issues
**MANDATORY**: Create this BEFORE first deployment

#### Step 5: Clean Previous Deployment Data (If Exists)
```bash
rm -rf .vercel
```
**Purpose**: Remove conflicting project settings from previous deployments
**Safe**: This command is always safe to run

### **PHASE 3: DEPLOYMENT EXECUTION**

#### Step 6: Initial Deployment
```bash
npx vercel --token {USER_PROVIDED_TOKEN} --yes
```
**Expected Output**: Preview URL (e.g., `https://your-project-abc123.vercel.app`)
**Extract**: Save the URL from stdout for verification

#### Step 7: Production Deployment (MANDATORY)
```bash
npx vercel --prod --token {USER_PROVIDED_TOKEN} --yes
```
**Purpose**: Deploy to main production domain
**Expected Output**: Production URL
**Critical**: This step ensures public accessibility

### **PHASE 4: VERIFICATION & VALIDATION**

#### Step 8: Deployment Verification Strategy
```bash
# Test main domain first (most likely to work)
curl -s -o /dev/null -w "%{http_code}" https://{YOUR_PROJECT_NAME}.vercel.app
```
**Expected**: HTTP 200 status
**If 401**: This is normal for preview URLs due to deployment protection
**Success Criteria**: Main domain returns HTTP 200

#### Step 9: Alternative URL Testing (If Needed)
```bash
# If main domain fails, test preview URL
curl -s -o /dev/null -w "%{http_code}" {PREVIEW_URL}
```
**Note**: Preview URLs may return 401 due to deployment protection, but main domain should work

### **PHASE 5: CLEANUP (MANDATORY)**

#### Step 10: Authentication Cleanup
```bash
npx vercel logout --token {USER_PROVIDED_TOKEN}
rm -rf ~/.vercel ~/.config/vercel 2>/dev/null || true
```
**CRITICAL**: This step is MANDATORY for security
**Purpose**: Remove all authentication traces

## 🛠️ ERROR HANDLING PROCEDURES

### **Error: "Could not retrieve Project Settings"**
**Cause**: Conflicting .vercel directory
**Solution**: Already handled in Step 5 (rm -rf .vercel)
**Prevention**: Always clean .vercel before deployment

### **Error: "Function Runtimes must have a valid version"**
**Cause**: Invalid functions configuration in vercel.json
**Solution**: Update vercel.json to remove functions section:
```bash
# Fix vercel.json by removing functions
cat > vercel.json << 'EOF'
{
  "public": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
EOF
```

### **HTTP 401 Status Codes**
**Expected Behavior**: Preview URLs may return 401 due to Vercel's deployment protection
**Solution**: Always check main domain `https://{YOUR_PROJECT_NAME}.vercel.app`
**Success Criteria**: Main domain returns HTTP 200

## 📋 AGENT EXECUTION CHECKLIST

**Phase 1 - Preparation:**
- [ ] ✅ Token validated with `whoami`
- [ ] ✅ Navigated to correct project directory
- [ ] ✅ Project built successfully (warnings OK, no errors)

**Phase 2 - Configuration:**
- [ ] ✅ Created vercel.json with public access
- [ ] ✅ Cleaned .vercel directory

**Phase 3 - Deployment:**
- [ ] ✅ Initial deployment completed
- [ ] ✅ Production deployment completed

**Phase 4 - Verification:**
- [ ] ✅ Main domain accessibility confirmed (HTTP 200)

**Phase 5 - Cleanup:**
- [ ] ✅ Vercel logout completed
- [ ] ✅ Configuration files cleaned

## 🎯 EXPECTED AGENT BEHAVIOR

### **Strict Compliance**
- **Follow Order**: Execute steps 1-10 in exact sequence
- **No Skipping**: Every step must be executed
- **Error Handling**: Use provided error solutions, don't improvise
- **Directory Focus**: Always work from local project directory

### **Success Indicators**
- **Token Valid**: `whoami` returns username
- **Build Success**: No build errors (warnings acceptable)
- **Deployment Success**: URLs generated for both preview and production
- **Access Success**: Main domain returns HTTP 200
- **Cleanup Success**: Logout confirmation received

### **Final Report Format**
Agent should provide:
```
✅ DEPLOYMENT SUCCESSFUL
📦 Project: {YOUR_PROJECT_NAME}
👤 User: {username}
🌐 Main URL: https://{YOUR_PROJECT_NAME}.vercel.app (HTTP 200)
🔗 Preview: {preview-url}
🔒 Cleanup: Completed
```

## 🔒 SECURITY PROTOCOL

1. **Token Scope**: Use only for deployment session
2. **No Persistence**: Never save tokens or credentials
3. **Mandatory Cleanup**: Always execute logout and file removal
4. **Local Focus**: Only deploy from workspace directories
5. **No Online Search**: Never search for existing Vercel projects

---

**⚠️ AGENT COMPLIANCE WARNING**: This guide must be followed exactly. Any deviation may result in deployment failures, security issues, or authentication problems. Agents must execute each step in the specified order and handle errors using the provided solutions only.