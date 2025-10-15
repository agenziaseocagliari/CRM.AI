/\*\*

- Visual Automation Builder Test Instructions
- Complete testing guide for the Level 6 automation system
  \*/

# VISUAL AUTOMATION BUILDER - TESTING GUIDE

## 🚀 QUICK START TESTING

### 1. Access the Automation Builder

- Navigate to: `http://localhost:5173/dashboard/automation`
- Verify the automation page loads with:
  - NodeSidebar on the left with trigger and action nodes
  - WorkflowCanvas on the right with React Flow interface
  - Toolbar with Save, Run, and Clear buttons

### 2. Test Drag & Drop Functionality

**Drag Trigger Nodes:**

- Drag "Form Submit" from sidebar to canvas
- Drag "Contact Update" from sidebar to canvas
- Drag "Deal Won" from sidebar to canvas

**Drag Action Nodes:**

- Drag "Send Email" from sidebar to canvas
- Drag "AI Score Contact" from sidebar to canvas
- Drag "Create Deal" from sidebar to canvas
- Drag "Update Contact" from sidebar to canvas

**Expected Result:** Nodes appear on canvas at drop location with proper labels and colors

### 3. Test Node Connections

- Click and drag from one node's connection point to another
- Create a workflow: Form Submit → AI Score Contact → Send Email
- **Expected Result:** Animated edges connect the nodes

### 4. Test Workflow Save Functionality

- Click "Save Workflow" button in toolbar
- **Expected Result:**
  - Button shows "Saving..." state
  - Success alert: "Workflow 'My Automation Workflow' saved successfully!"
  - Workflow saved to browser localStorage
  - Console logs workflow data

### 5. Test Workflow Execution

- Ensure you have nodes and connections on canvas
- Click "Run Workflow" button
- **Expected Result:**
  - Button shows "Running..." state and becomes disabled
  - Success alert with execution statistics (e.g., "2/2 nodes succeeded")
  - Console shows detailed execution results
  - Each node executes with simulated results

---

## 🔬 ADVANCED TESTING SCENARIOS

### Scenario 1: Lead Scoring Automation

1. Create workflow:
   - Form Submit (trigger) → AI Score Contact → Create Deal → Send Email
2. Save workflow
3. Execute workflow
4. **Verify:** Each action runs with appropriate simulated data

### Scenario 2: Error Handling

1. Create workflow with invalid node connections
2. Try to execute empty workflow
3. **Verify:** Appropriate error messages and graceful handling

### Scenario 3: Multiple Workflows

1. Create and save multiple different workflows
2. **Verify:** Each workflow is stored separately in localStorage
3. Check browser Developer Tools → Application → Local Storage

### Scenario 4: Canvas Controls

1. Test React Flow controls:
   - Zoom in/out with mouse wheel
   - Pan by dragging empty canvas area
   - Use control buttons (zoom, fit view, etc.)
2. **Verify:** Smooth canvas navigation

---

## 📊 EXPECTED CONSOLE OUTPUT

### When Saving Workflow:

```javascript
Workflow saved: {
  id: "workflow_1736434567890",
  name: "My Automation Workflow",
  user_id: "current_user",
  nodes: [...],
  edges: [...],
  created_at: "2025-01-09T..."
}
```

### When Executing Workflow:

```javascript
Workflow execution completed in 45ms: {
  id: "exec_1736434567891",
  workflow_id: "workflow_1736434567890",
  results: [
    {
      nodeId: "trigger-1",
      success: true,
      result: { message: "Form submission trigger activated" }
    },
    {
      nodeId: "action-1",
      success: true,
      result: { leadScore: 87, category: "hot" }
    }
  ],
  success: true,
  error_count: 0
}
```

---

## 🛠️ TROUBLESHOOTING

### Issue: Nodes not appearing when dragged

- **Check:** Browser console for JavaScript errors
- **Verify:** React Flow properly initialized
- **Solution:** Refresh page and try again

### Issue: Save button not working

- **Check:** Browser localStorage is enabled
- **Verify:** No console errors during save operation
- **Solution:** Clear localStorage and retry

### Issue: Execution not running

- **Check:** Workflow has at least one trigger node
- **Verify:** Nodes are properly connected
- **Solution:** Ensure workflow has valid structure

### Issue: Canvas not responsive

- **Check:** Container has proper height/width
- **Verify:** React Flow providers are properly wrapped
- **Solution:** Refresh and check for CSS conflicts

---

## ✅ VALIDATION CHECKLIST

### Core Functionality

- [ ] NodeSidebar displays all trigger and action types
- [ ] Drag and drop creates nodes on canvas
- [ ] Nodes can be connected with edges
- [ ] Save workflow persists data to localStorage
- [ ] Run workflow executes with simulated results

### User Experience

- [ ] Intuitive drag and drop interface
- [ ] Clear visual feedback during operations
- [ ] Appropriate loading states and messages
- [ ] Error handling with user-friendly alerts

### Technical Implementation

- [ ] TypeScript compilation without workflow-related errors
- [ ] React Flow integration working properly
- [ ] Local state management functioning
- [ ] Console logging provides debugging information

### Data Persistence

- [ ] Workflows saved to browser localStorage
- [ ] Execution history tracked
- [ ] Data structure matches expected schema

---

## 🎯 SUCCESS CRITERIA

The Visual Automation Builder is considered **FULLY FUNCTIONAL** when:

1. ✅ **UI/UX Complete:** Drag-drop interface with professional appearance
2. ✅ **Core Operations:** Save and execute workflows successfully
3. ✅ **Data Management:** Persistent storage with proper structure
4. ✅ **Error Handling:** Graceful error management and user feedback
5. ✅ **Integration Ready:** Architecture supports future backend integration

---

## 🚀 NEXT STEPS FOR PRODUCTION

### Phase 4 Enhancements:

1. **Real Backend Integration:** Replace localStorage with Supabase API
2. **Advanced Node Types:** Conditional logic, loops, parallel execution
3. **Workflow Templates:** Pre-built automation patterns
4. **Real-time Monitoring:** Live execution status and metrics
5. **Team Collaboration:** Shared workflows and permissions

**Current Status: PHASE 3 COMPLETE - Ready for Production Testing**
