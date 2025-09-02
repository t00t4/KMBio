# Manual Testing Plan - Navigation Fixes

## Overview
Este documento descreve o plano de testes manuais para validar as correções implementadas nos botões "Conectar Dispositivo" e "Sair da Conta".

## Test Environment
- **Device**: Physical Android/iOS device
- **Build**: Development build with debug logging enabled
- **Network**: Stable internet connection
- **Prerequisites**: App installed and user logged in

## Test Cases

### TC001: Connect Device Button - Basic Functionality
**Objective**: Verify that the "Conectar Dispositivo" button works correctly

**Steps**:
1. Open the app and navigate to Dashboard
2. Ensure Bluetooth is enabled on device
3. Verify button shows "Conectar Dispositivo" when not connected
4. Tap the "Conectar Dispositivo" button
5. Observe navigation to Pairing screen

**Expected Results**:
- Button should be visible and enabled
- Button should provide immediate visual feedback when pressed
- Navigation to Pairing screen should occur within 500ms
- Debug logs should show button press and navigation events
- No error messages should appear

**Debug Logs to Check**:
```
🔥 Connect OBD button pressed - initiating navigation to Pairing screen
📱 User interaction detected - processing navigation request
🚀 Navigating to Pairing screen...
✅ Navigation to Pairing screen completed successfully
```

### TC002: Connect Device Button - Loading States
**Objective**: Verify loading states and disabled states work correctly

**Steps**:
1. Navigate to Dashboard
2. Tap "Conectar Dispositivo" button
3. Immediately try to tap the button again multiple times
4. Observe button state during navigation

**Expected Results**:
- Button should show loading state briefly
- Multiple taps should be ignored (debounced)
- Button should be disabled during navigation
- Loading indicator should be visible if navigation takes time

### TC003: Connect Device Button - Connected State
**Objective**: Verify button behavior when device is already connected

**Prerequisites**: Mock or actual BLE device connected

**Steps**:
1. Ensure a BLE device is connected
2. Navigate to Dashboard
3. Observe button text and state
4. Tap the button

**Expected Results**:
- Button should show "Gerenciar Conexão" instead of "Conectar Dispositivo"
- Button should still navigate to Pairing screen
- Connection status should be displayed correctly

### TC004: Connect Device Button - Error Handling
**Objective**: Verify error handling when navigation fails

**Steps**:
1. Navigate to Dashboard
2. Simulate navigation error (if possible) or test with network issues
3. Tap "Conectar Dispositivo" button
4. Observe error handling

**Expected Results**:
- If navigation fails, user should see error dialog
- Error dialog should offer retry option
- Error should be logged for debugging
- App should remain stable and functional

### TC005: Logout Button - Basic Functionality
**Objective**: Verify that the "Sair da Conta" button works correctly

**Steps**:
1. Navigate to Settings screen
2. Scroll to bottom to find "Sair da Conta" button
3. Tap the "Sair da Conta" button
4. Observe confirmation dialog
5. Tap "Cancelar" in dialog
6. Verify user remains logged in

**Expected Results**:
- Button should be visible and enabled
- Confirmation dialog should appear with proper text
- Canceling should keep user logged in
- No logout should occur

### TC006: Logout Button - Successful Logout
**Objective**: Verify successful logout flow

**Steps**:
1. Navigate to Settings screen
2. Tap "Sair da Conta" button
3. In confirmation dialog, tap "Sair"
4. Observe logout process
5. Verify navigation to login screen

**Expected Results**:
- Button should show loading state during logout
- User should be logged out successfully
- App should navigate to login/auth screen
- User session should be cleared
- No error messages should appear

**Debug Logs to Check**:
```
🔥 Logout button pressed - showing confirmation dialog
✅ User confirmed logout - initiating sign out process
🚀 Calling signOut function...
✅ User logged out successfully
```

### TC007: Logout Button - Loading States
**Objective**: Verify loading states during logout process

**Steps**:
1. Navigate to Settings screen
2. Tap "Sair da Conta" button
3. Tap "Sair" in confirmation dialog
4. Observe button state during logout process
5. Try tapping logout button again while logout is in progress

**Expected Results**:
- Button should show "Saindo..." text during logout
- Button should be disabled during logout process
- Multiple logout attempts should be prevented
- Loading indicator should be visible

### TC008: Logout Button - Error Handling
**Objective**: Verify error handling when logout fails

**Prerequisites**: Simulate network error or auth service failure

**Steps**:
1. Navigate to Settings screen
2. Disconnect from internet or simulate auth error
3. Tap "Sair da Conta" button
4. Tap "Sair" in confirmation dialog
5. Observe error handling

**Expected Results**:
- If logout fails, user should see error dialog
- Error dialog should offer retry option
- User should remain logged in if logout fails
- Error should be logged for debugging
- App should remain stable

### TC009: Navigation Responsiveness
**Objective**: Verify overall navigation responsiveness

**Steps**:
1. Test rapid navigation between screens
2. Test button presses in quick succession
3. Test navigation during various app states (loading, connected, etc.)
4. Monitor app performance and responsiveness

**Expected Results**:
- All navigation should be smooth and responsive
- No crashes or freezes should occur
- Debouncing should prevent duplicate actions
- App should maintain good performance

### TC010: Debug Logging Verification
**Objective**: Verify debug logging is working correctly

**Steps**:
1. Enable debug logging/console output
2. Perform all button interactions
3. Check console logs for proper debug output
4. Verify log format and content

**Expected Results**:
- All button presses should be logged
- Navigation events should be logged
- Error events should be logged with details
- Log format should be consistent and readable

## Test Results Template

### Test Execution Date: ___________
### Tester: ___________
### Device: ___________
### OS Version: ___________

| Test Case | Status | Notes | Issues Found |
|-----------|--------|-------|--------------|
| TC001 | ☐ Pass ☐ Fail | | |
| TC002 | ☐ Pass ☐ Fail | | |
| TC003 | ☐ Pass ☐ Fail | | |
| TC004 | ☐ Pass ☐ Fail | | |
| TC005 | ☐ Pass ☐ Fail | | |
| TC006 | ☐ Pass ☐ Fail | | |
| TC007 | ☐ Pass ☐ Fail | | |
| TC008 | ☐ Pass ☐ Fail | | |
| TC009 | ☐ Pass ☐ Fail | | |
| TC010 | ☐ Pass ☐ Fail | | |

## Issues Found
_Document any issues found during testing_

## Overall Assessment
_Provide overall assessment of the navigation fixes_

## Recommendations
_Any recommendations for further improvements_