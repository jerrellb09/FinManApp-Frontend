# Bills Management Feature

This module implements the user interface for managing recurring bills and expenses in the FinManApp application.

## Features

### Bill Dashboard
- Overview of all bills with status indicators
- Due soon and overdue bill alerts
- Monthly payment progress tracking
- Remaining income calculation

### Bill List
- Complete list of all bills
- Filtering options (paid/unpaid)
- Actions: mark as paid, edit, delete
- Monthly bill reset functionality

### Bill Form
- Add new bills
- Edit existing bills
- Set bill due dates, amounts, and recurrence
- Categorize bills for budget tracking

## Integration with Backend

The bills feature connects to the following API endpoints:
- GET /api/bills/user/{userId} - Get all user bills
- GET /api/bills/due/{userId} - Get currently due bills
- POST /api/bills?userId={userId} - Create a new bill
- PUT /api/bills/{billId} - Update an existing bill
- DELETE /api/bills/{billId} - Delete a bill
- PATCH /api/bills/{billId}/pay - Mark a bill as paid
- GET /api/bills/remaining-income/{userId} - Get remaining income after bills
- POST /api/bills/reset-monthly/{userId} - Reset recurring bills for the new month