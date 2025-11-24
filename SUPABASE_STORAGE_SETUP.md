# Supabase Storage Setup for Image Uploads

The "Failed to upload file" error occurs because the Supabase storage bucket doesn't exist. Here's how to fix it:

## 🗂️ **Create the Storage Bucket**

### **1. Go to Supabase Dashboard**
- Visit: https://supabase.com/dashboard
- Select your project (the same one used by Reyaq)

### **2. Create Storage Bucket**
1. **Click "Storage"** in the left sidebar
2. **Click "New bucket"** 
3. **Bucket name**: `requests`
4. **Public bucket**: ✅ **Enable** (so images can be viewed publicly)
5. **File size limit**: 5MB (optional, matches our validation)
6. **Allowed MIME types**: Leave empty or add: `image/jpeg,image/png,image/webp,image/heic`
7. **Click "Save"**

### **3. Set Bucket Policies (Important!)**

After creating the bucket, you need to set up policies so users can upload and view images:

1. **Still in Storage**, click on your `requests` bucket
2. **Click "Policies"** tab
3. **Click "New Policy"**

**Policy 1: Allow uploads**
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
((bucket_id = 'requests'::text) AND (auth.role() = 'authenticated'::text))
```

**Policy 2: Allow public viewing**
- **Policy name**: `Allow public viewing`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
(bucket_id = 'requests'::text)
```

## 🎯 **Quick Test**

After setting up the bucket and policies:

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Test image upload**:
   - Go to: http://localhost:3000/start
   - Choose "Upload Image" 
   - Select an image file
   - Fill out the form and submit
   - Should work without "Failed to upload file" error

## 🔍 **Alternative: Check Existing Buckets**

You might already have a storage bucket in your Reyaq project:

1. **Go to Storage** in Supabase Dashboard
2. **Check if any buckets exist** with similar names
3. **If you find one**, you can either:
   - Use the existing bucket (change `'requests'` to the existing bucket name in the upload API)
   - Or create the new `requests` bucket as described above

## 🚨 **Common Issues**

### Issue: "Storage bucket not configured" 
**Solution**: Follow the steps above to create the `requests` bucket

### Issue: "Permission denied" when uploading
**Solution**: Make sure you set up the bucket policies (step 3 above)

### Issue: Images upload but can't be viewed
**Solution**: Make sure the bucket is set to **public** and has the public viewing policy

### Issue: "File too large" errors  
**Solution**: Check your bucket file size limits match the 5MB limit in the code

## 📂 **Bucket Structure**

Your images will be stored as:
```
requests/
  ├── user-id-1/
  │   ├── uuid-1.jpg
  │   ├── uuid-2.png
  │   └── ...
  ├── user-id-2/
  │   ├── uuid-3.jpg
  │   └── ...
  └── ...
```

Each user gets their own folder, and each image gets a unique UUID filename.

## 🔒 **Security Note**

The current setup allows:
- ✅ **Authenticated users** can upload images
- ✅ **Anyone** can view images (needed for judges to see them)
- ❌ **Anonymous users** cannot upload
- ❌ **Users cannot delete other users' images**

This is appropriate for the verdict use case where judges need to see uploaded images.