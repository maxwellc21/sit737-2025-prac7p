# 🚀 Kubernetes MongoDB Auth Service

Welcome to the **Kubernetes MongoDB Auth Service** repository! 🛠️ This project provides Kubernetes manifests and application code to deploy a **Node.js authentication service** backed by MongoDB.

## 📜 Overview

This setup includes:

- ✅ Data persistence with Kubernetes volumes
- 🔐 Secure credential management
- 🔄 Automated backups to ensure data safety
- 📈 Prometheus-based monitoring for health tracking

## 📂 Repository Structure

```text
k8s/
├── mongo-pv.yaml         # Persistent Volume for MongoDB
├── mongo-pvc.yaml        # Persistent Volume Claim
├── auth-secret.yaml      # Authentication secrets
├── mongo-standalone.yaml # MongoDB Deployment
├── auth-deployment.yaml  # Auth Service Deployment
├── backup-pvc.yaml       # Backup storage PVC
├── backup-cronjob.yaml   # Scheduled backup job
└── mongo-exporter.yaml   # Prometheus MongoDB Exporter
server.js                 # Node.js authentication service entry point
README.md                 # This file
```

## 🔧 Prerequisites

Before deploying, make sure you have:

1. A Kubernetes cluster with `kubectl` access
2. A HostPath directory `/mnt/data` (or equivalent) for persistent storage
3. Docker & Node.js installed for local builds

## 🚀 Deployment Steps

1. **Apply Storage and Secrets**

   ```bash
   kubectl apply -f k8s/mongo-pv.yaml \
                  -f k8s/mongo-pvc.yaml \
                  -f k8s/auth-secret.yaml
   ```

2. **Deploy MongoDB and Auth Service**

   ```bash
   kubectl apply -f k8s/mongo-standalone.yaml \
                  -f k8s/auth-deployment.yaml
   ```

3. **Configure Backups and Monitoring**
   ```bash
   kubectl apply -f k8s/backup-pvc.yaml \
                  -f k8s/backup-cronjob.yaml \
                  -f k8s/mongo-exporter.yaml
   ```

## 🧪 Testing

1. **Signup Endpoint**

   ```bash
   curl -X POST http://localhost:4000/signup \
        -d '{"username":"test","password":"securepass"}' \
        -H "Content-Type: application/json"
   ```

2. **Verify Users in MongoDB**

   ```bash
   kubectl exec -it <mongo-pod> -n edugo-auth -- \
     mongo --eval "db.authdb.users.find().pretty()"
   ```

3. **Backup Verification**  
   Inspect the hostPath (e.g. `/mnt/data/mongo-backups`) to confirm scheduled backups have run.

## 🗑️ Cleanup

To remove all deployed resources:

```bash
kubectl delete all,pvc -l app=mongo-standalone -n edugo-auth
kubectl delete secret auth-secret -n edugo-auth
```

---

🎉 Happy Deploying! 🚀  
Feel free to fork, modify, and improve the setup. Contributions are always welcome. 😊
