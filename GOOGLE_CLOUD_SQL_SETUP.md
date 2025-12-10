# Google Cloud SQL Setup for LangGraph Memory Persistence

This guide walks you through setting up Google Cloud SQL for PostgreSQL to enable persistent conversation memory for the AI Shopping Assistant using LangGraph's PostgresSaver.

## 🎯 Why PostgreSQL?

- **Persistent Memory**: Conversations survive app restarts
- **Scalable**: Handles thousands of concurrent conversations
- **Managed**: Google handles backups, updates, and high availability
- **Affordable**: Free tier available (db-f1-micro)

---

## 📋 Prerequisites

1. **Google Cloud Account**: [Create one here](https://cloud.google.com/free) (free $300 credit)
2. **gcloud CLI**: [Install guide](https://cloud.google.com/sdk/docs/install)
3. **Python 3.9+**: Already installed for your project

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Install gcloud CLI

**Windows (PowerShell):**
```powershell
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

**Mac/Linux:**
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Step 2: Initialize gcloud and Login

```bash
gcloud init
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Enable Cloud SQL API

```bash
gcloud services enable sqladmin.googleapis.com
```

### Step 4: Create Cloud SQL Instance

**Free Tier (db-f1-micro - Shared CPU, 0.6GB RAM):**
```bash
gcloud sql instances create langgraph-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --enable-ip-alias \
  --backup-start-time=03:00
```

**Production Tier (db-n1-standard-1 - 1 vCPU, 3.75GB RAM):**
```bash
gcloud sql instances create langgraph-db \
  --database-version=POSTGRES_15 \
  --tier=db-n1-standard-1 \
  --region=us-central1 \
  --enable-ip-alias \
  --backup-start-time=03:00
```

⏱️ **Wait time:** ~5-10 minutes for instance creation

### Step 5: Create Database and User

```bash
# Create database
gcloud sql databases create langgraph --instance=langgraph-db

# Create user with secure password
gcloud sql users create langgraph_user \
  --instance=langgraph-db \
  --password='YOUR_SECURE_PASSWORD_HERE'
```

> 🔐 **Important:** Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password (save it securely!)

### Step 6: Get Cloud SQL IP Address

```bash
gcloud sql instances describe langgraph-db \
  --format='value(ipAddresses[0].ipAddress)'
```

**Example output:** `34.71.123.45`

### Step 7: Authorize Your IP Address

**Get your public IP:**
```bash
# Windows PowerShell
(Invoke-WebRequest -Uri "https://ifconfig.me").Content

# Mac/Linux
curl ifconfig.me
```

**Authorize your IP:**
```bash
gcloud sql instances patch langgraph-db \
  --authorized-networks=YOUR_PUBLIC_IP/32
```

> 📝 **Note:** Replace `YOUR_PUBLIC_IP` with your IP from above (e.g., `203.0.113.45/32`)

---

## 🔧 Configure Your Application

### Step 8: Install Python Dependencies

```bash
pip install -r requirements.txt
```

### Step 9: Set Environment Variable

**Create `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

**Edit `.env` file** and update:
```env
LANGGRAPH_DB_URI=postgresql://langgraph_user:YOUR_PASSWORD@YOUR_CLOUD_SQL_IP:5432/langgraph
```

**Example:**
```env
LANGGRAPH_DB_URI=postgresql://langgraph_user:MySecurePass123@34.71.123.45:5432/langgraph
```

### Step 10: Test Connection

```bash
python postgres_checkpointer.py
```

**Expected output:**
```
============================================================
PostgreSQL Checkpointer Connection Test
============================================================
Database URI: 34.71.123.45:5432/langgraph
✓ Connection: SUCCESS
✓ Tables: Initialized

Your LangGraph agent conversations will now persist!
============================================================
```

---

## ✅ Verify Setup

### Test Conversation Persistence

```python
# Run your WhatsApp bot
python whatsapp_msg.py

# Send messages from WhatsApp
# Restart the app
# Send another message - conversation history should be preserved!
```

### Check Database State

```bash
# Connect to Cloud SQL
gcloud sql connect langgraph-db --user=langgraph_user --database=langgraph

# List tables (once connected)
\dt

# View checkpoints
SELECT thread_id, checkpoint_id, parent_checkpoint_id 
FROM checkpoints 
ORDER BY checkpoint_id DESC 
LIMIT 10;

# Exit
\q
```

---

## 💰 Pricing

### Google Cloud SQL Costs

| Tier | vCPU | RAM | Storage | Monthly Cost | Use Case |
|------|------|-----|---------|--------------|----------|
| **db-f1-micro** | Shared | 0.6 GB | 10 GB | **$0** (Always Free) | Development |
| **db-f1-micro** | Shared | 0.6 GB | 10 GB | **~$5** (after free tier) | Small production |
| **db-g1-small** | Shared | 1.7 GB | 10 GB | ~$25 | Medium traffic |
| **db-n1-standard-1** | 1 | 3.75 GB | 10 GB | ~$50 | High traffic |

**Storage:** $0.17/GB/month after 10GB

### Always Free Tier Limits

- **1 db-f1-micro instance** per month
- **10 GB storage**
- **1 GB/month network egress** (within US)

---

## 🔐 Security Best Practices

### 1. Use Private IP (Recommended for Production)

If deploying to Google Cloud Run/App Engine:

```bash
# Enable Private Service Connect
gcloud sql instances patch langgraph-db \
  --network=projects/YOUR_PROJECT_ID/global/networks/default

# Get private IP
gcloud sql instances describe langgraph-db \
  --format='value(ipAddresses[1].ipAddress)'

# Update .env
LANGGRAPH_DB_URI=postgresql://langgraph_user:password@10.123.0.2/langgraph?sslmode=disable
```

### 2. Use Cloud SQL Proxy (Alternative)

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Run proxy
./cloud-sql-proxy --instances=PROJECT_ID:REGION:langgraph-db=tcp:5432

# Connect via localhost
LANGGRAPH_DB_URI=postgresql://langgraph_user:password@localhost:5432/langgraph
```

### 3. Rotate Passwords Regularly

```bash
gcloud sql users set-password langgraph_user \
  --instance=langgraph-db \
  --password='NEW_SECURE_PASSWORD'
```

---

## 🛠️ Troubleshooting

### Connection Refused

**Issue:** `could not connect to server: Connection refused`

**Solutions:**
1. Verify your IP is authorized:
   ```bash
   gcloud sql instances describe langgraph-db --format='value(settings.ipConfiguration.authorizedNetworks)'
   ```

2. Add your IP:
   ```bash
   gcloud sql instances patch langgraph-db --authorized-networks=YOUR_IP/32
   ```

3. Check instance is running:
   ```bash
   gcloud sql instances list
   ```

### Authentication Failed

**Issue:** `password authentication failed for user "langgraph_user"`

**Solutions:**
1. Reset password:
   ```bash
   gcloud sql users set-password langgraph_user --instance=langgraph-db --password='NEW_PASSWORD'
   ```

2. Verify username exists:
   ```bash
   gcloud sql users list --instance=langgraph-db
   ```

### Table Does Not Exist

**Issue:** `relation "checkpoints" does not exist`

**Solution:** Run setup:
```bash
python postgres_checkpointer.py
```

### Instance Creation Failed

**Issue:** `ERROR: (gcloud.sql.instances.create) PERMISSION_DENIED`

**Solutions:**
1. Enable Cloud SQL API:
   ```bash
   gcloud services enable sqladmin.googleapis.com
   ```

2. Verify billing is enabled:
   ```bash
   gcloud billing accounts list
   ```

---

## 🚀 Production Deployment

### Terraform (Infrastructure as Code)

Create `cloud_sql.tf`:

```hcl
# cloud_sql.tf
resource "google_sql_database_instance" "langgraph" {
  name             = "langgraph-db"
  database_version = "POSTGRES_15"
  region           = "us-central1"

  settings {
    tier = "db-f1-micro"
    
    ip_configuration {
      ipv4_enabled    = true
      require_ssl     = true
      authorized_networks {
        name  = "office"
        value = "203.0.113.0/24"
      }
    }

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "langgraph" {
  name     = "langgraph"
  instance = google_sql_database_instance.langgraph.name
}

resource "google_sql_user" "langgraph" {
  name     = "langgraph_user"
  instance = google_sql_database_instance.langgraph.name
  password = var.db_password
}

output "instance_connection_name" {
  value = google_sql_database_instance.langgraph.connection_name
}

output "public_ip" {
  value = google_sql_database_instance.langgraph.public_ip_address
}
```

Deploy:
```bash
terraform init
terraform plan -var="db_password=YOUR_SECURE_PASSWORD"
terraform apply
```

---

## 📚 Additional Resources

- [Google Cloud SQL Documentation](https://cloud.google.com/sql/docs/postgres)
- [LangGraph PostgresSaver Docs](https://langchain-ai.github.io/langgraph/reference/checkpoints/#langgraph.checkpoint.postgres.PostgresSaver)
- [gcloud SQL Command Reference](https://cloud.google.com/sdk/gcloud/reference/sql)
- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)

---

## 🆘 Support

If you encounter issues:

1. **Check logs:**
   ```bash
   gcloud sql operations list --instance=langgraph-db --limit=10
   ```

2. **View instance details:**
   ```bash
   gcloud sql instances describe langgraph-db
   ```

3. **Test connection:**
   ```bash
   python postgres_checkpointer.py
   ```

4. **Contact support:**
   - Google Cloud Support: https://cloud.google.com/support
   - LangGraph Issues: https://github.com/langchain-ai/langgraph/issues

---

**🎉 Congratulations!** Your AI Shopping Assistant now has persistent conversation memory powered by Google Cloud SQL!
