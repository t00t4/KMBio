# Vehicle Management Testing Guide

This guide provides manual testing steps to verify the vehicle management functionality.

## Prerequisites

1. Supabase project set up with the database schema from `database/setup.sql`
2. Environment variables configured in `.env`
3. App running on a device or emulator

## Test Scenarios

### 1. Database Setup Verification

**Steps:**
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following query to verify tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('vehicles', 'trips', 'trip_events', 'weekly_summaries', 'tips');
```
4. Verify all 5 tables are returned

**Expected Result:** All tables should be present

### 2. Add Vehicle Flow

**Steps:**
1. Open the app and complete authentication/onboarding
2. Navigate to Settings → Manage Vehicles
3. Tap "Add Vehicle" (+ button)
4. Fill in the form with valid data:
   - Name: "Honda Civic 2020"
   - Make: "Honda"
   - Model: "Civic"
   - Year: "2020"
   - Fuel Type: "Flex"
   - Engine Size: "1.6"
5. Tap "Save Vehicle"

**Expected Result:** 
- Success message appears
- Returns to vehicle list
- New vehicle appears in the list
- Vehicle is marked as "Active" (first vehicle)

### 3. Form Validation

**Steps:**
1. Navigate to Add Vehicle screen
2. Try to save with empty fields
3. Try invalid data:
   - Year: "1980" (too old)
   - Engine Size: "abc" (non-numeric)
   - Name: "A" (too short)

**Expected Result:**
- Error messages appear for each invalid field
- Form cannot be submitted until all errors are fixed

### 4. Edit Vehicle

**Steps:**
1. From vehicle list, tap "Edit" on a vehicle
2. Modify some fields (e.g., change name to "My Honda Civic")
3. Tap "Save Changes"

**Expected Result:**
- Success message appears
- Returns to vehicle list
- Changes are reflected in the list

### 5. Multiple Vehicles and Active Selection

**Steps:**
1. Add a second vehicle (different make/model)
2. Verify first vehicle remains active
3. Tap "Activate" on the second vehicle
4. Verify active status switches

**Expected Result:**
- Only one vehicle can be active at a time
- Active badge moves to the selected vehicle

### 6. Delete Vehicle

**Steps:**
1. Tap "Remove" on a non-active vehicle
2. Confirm deletion in the alert
3. Try to delete the active vehicle

**Expected Result:**
- Non-active vehicle is deleted successfully
- If deleting active vehicle, another vehicle becomes active automatically
- If deleting the last vehicle, list shows empty state

### 7. Data Persistence

**Steps:**
1. Add a vehicle
2. Close and reopen the app
3. Navigate to vehicle management

**Expected Result:**
- Vehicle data persists across app restarts
- Active vehicle selection is maintained

### 8. Error Handling

**Steps:**
1. Turn off internet connection
2. Try to add/edit/delete a vehicle
3. Turn internet back on
4. Try the operation again

**Expected Result:**
- Appropriate error messages for network issues
- Operations work when connection is restored

### 9. Form Input Formatting

**Steps:**
1. In Add Vehicle form, test engine size input:
   - Type "1,6" → should format to "1.6"
   - Type "2.0L" → should format to "2.0"
   - Type "3.14159" → should format to "3.1"
2. Test year input:
   - Type "2020abc" → should format to "2020"

**Expected Result:**
- Inputs are automatically formatted as expected
- Invalid characters are removed

### 10. Navigation Flow

**Steps:**
1. Navigate: Settings → Manage Vehicles → Add Vehicle
2. Use back button/navigation to return
3. Navigate: Settings → Manage Vehicles → Edit Vehicle
4. Use back button/navigation to return

**Expected Result:**
- Navigation works smoothly in all directions
- No crashes or unexpected behavior

## Database Verification Queries

After testing, you can verify data in Supabase:

```sql
-- Check vehicles table
SELECT * FROM vehicles ORDER BY created_at DESC;

-- Check active vehicle constraint
SELECT user_id, COUNT(*) as active_count 
FROM vehicles 
WHERE is_active = true 
GROUP BY user_id;

-- Verify user can only see their own vehicles (RLS)
SELECT * FROM vehicles WHERE user_id = auth.uid();
```

## Common Issues and Solutions

### Issue: "User not authenticated" error
**Solution:** Ensure user is logged in and auth token is valid

### Issue: Database connection errors
**Solution:** Check Supabase URL and API key in environment variables

### Issue: Form validation not working
**Solution:** Check that validation functions are imported correctly

### Issue: Navigation errors
**Solution:** Verify navigation types and screen names match

## Performance Considerations

- Vehicle list should load quickly (< 2 seconds)
- Form validation should be responsive (< 100ms)
- Database operations should complete within 5 seconds
- App should handle 10+ vehicles without performance issues