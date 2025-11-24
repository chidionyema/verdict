# 🧪 **How to Test the Demographics System**

## 🚀 **Setup Steps**

### 1. **Run Database Migration**
```bash
# Go to Supabase Dashboard > SQL Editor
# Copy and run the content of: supabase/migrations/020_judge_demographics.sql
```

### 2. **Start Development Server**
```bash
npm run dev
```

### 3. **Create Test Accounts**
```bash
# Create 2-3 test accounts:
# 1. User account (for making requests)
# 2. Judge account 1 (different demographics)
# 3. Judge account 2 (different demographics)
```

## 🎯 **Testing Flow**

### **Step 1: Complete Judge Qualification (Now Includes Demographics!)**

1. **Sign up/Login as Judge**
   - Go to `/auth/signup`
   - Create account with email like `judge1@test.com`

2. **Complete Judge Qualification Flow**
   - Go to `/judge/qualify`
   - Complete all steps:
     - **Step 1**: Welcome and overview
     - **Step 2**: Judge guidelines and expectations  
     - **Step 3**: Qualification quiz (need 75%+)
     - **Step 4**: Demographics setup (NEW! - automatically shows after passing quiz)

3. **Demographics Are Now Part of Onboarding**
   - After passing the quiz, demographics form automatically appears
   - Complete the 4-step demographics form:
     - **Step 1**: Age range, gender, ethnicity, location
     - **Step 2**: Education, profession, relationship, income
     - **Step 3**: Lifestyle tags, interests
     - **Step 4**: Privacy settings (what's visible)
   - Only becomes judge AFTER completing demographics

4. **Repeat for Multiple Judges**
   - Create 2-3 judges with different demographics
   - Each must complete full qualification + demographics flow

### **Step 2: Test User Request Flow**

1. **Sign up as User**
   - Create regular user account: `user@test.com`

2. **Start New Request**
   - Go to `/start`
   - Follow the new 4-step flow:

3. **Step 1: Upload Content**
   - Upload photo or enter text

4. **Step 2: Choose Category**
   - Select feedback type (appearance, profile, etc.)

5. **Step 3: Choose Judges** ⭐ **NEW FEATURE**
   - **Priority Mode**: Select Speed/Diversity/Expertise/Balanced
   - **Filters**: Choose age ranges, genders, professions
   - **Advanced Filters**: Education, background, location
   - **Pool Preview**: See estimated judges available, response time
   - Click "Continue with These Judges"

6. **Step 4: Add Context**
   - Add context and submit

### **Step 3: Verify Database**

1. **Check Judge Data**
   ```sql
   SELECT * FROM judge_demographics;
   SELECT * FROM judge_availability;
   ```

2. **Check Request Preferences**
   ```sql
   SELECT * FROM request_judge_preferences;
   SELECT * FROM judge_assignments;
   ```

3. **Test Matching Function**
   ```sql
   SELECT * FROM get_available_judges_for_request('[request_id]');
   ```

## 🔍 **What to Test**

### **Judge Demographics Form**
- [ ] All 4 steps work smoothly
- [ ] Privacy toggles work (show/hide fields)
- [ ] Profile preview updates in real-time
- [ ] Data saves correctly to database
- [ ] Form validates required fields

### **User Judge Selection**
- [ ] Priority modes affect pool size/timing
- [ ] Filters reduce available judge count
- [ ] "All" options work correctly
- [ ] Pool preview shows realistic numbers
- [ ] Advanced filters toggle properly

### **Integration**
- [ ] Navigation shows demographics link for judges
- [ ] Request flow includes judge selection step
- [ ] Progress indicators show 4 steps
- [ ] Data flows through API correctly

### **Edge Cases**
- [ ] No judges match filters (show message)
- [ ] All judges selected (no filtering)
- [ ] Judge with no demographics visible
- [ ] Invalid preference combinations

## 🐛 **Common Issues & Fixes**

### **Database Issues**
```sql
-- If judges table is empty:
UPDATE profiles SET is_judge = true WHERE email LIKE '%judge%';

-- If demographics not saving:
DELETE FROM judge_demographics WHERE judge_id = '[your-judge-id]';
-- Then re-fill the form
```

### **UI Issues**
```bash
# If components not found:
npm run dev  # Restart server

# If styling broken:
# Check Tailwind classes in components
```

### **API Issues**
```bash
# Check browser Network tab for:
# POST /api/judge/demographics (should return 200)
# POST /api/requests (should include judge_preferences)
```

## ✅ **Success Criteria**

You know it's working when:

1. **Judge can set demographics** with privacy controls
2. **Users see judge selection step** in request flow  
3. **Pool size changes** based on filters
4. **Request includes preferences** in API payload
5. **Database stores** all demographic and preference data

## 🎉 **Expected User Experience**

**For Judges:**
- Clean, professional demographics form
- Privacy controls feel secure and intuitive
- Profile preview shows exactly what users see

**For Users:**
- Easy filter selection with real-time feedback
- Pool preview builds confidence in match quality
- No overwhelming options - smart defaults

**For Both:**
- Fast, responsive interface
- Clear progress indicators
- Smooth flow between steps

---

This system transforms Verdict from generic feedback to **targeted, relevant opinions from the exact type of people users want to hear from**. 🎯