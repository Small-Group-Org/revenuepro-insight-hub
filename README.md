# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/edf65cac-663e-407d-b06b-971f0477f4b2

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/edf65cac-663e-407d-b06b-971f0477f4b2) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- xlsx (for Excel export functionality)

## Features

### Excel Export Functionality

The application includes a comprehensive Excel export feature for the Target vs Actual comparison results:

- **Export Location**: Available on the Compare Results page
- **File Format**: Excel (.xlsx) with proper formatting and styling
- **Content**: Includes all metrics organized by categories (Funnel Metrics, Revenue Metrics, Expense Metrics, Performance Metrics)
- **Additional Data**: Summary section with key performance indicators
- **Formatting**: Proper currency, percentage, and number formatting
- **Styling**: Headers, category sections, and data are properly styled for readability

To export data:
1. Navigate to the Compare Results page
2. Select your desired date and period (weekly/monthly/yearly)
3. Wait for the data to load
4. Click the "Export to Excel" button
5. The file will be automatically downloaded with a descriptive filename

The exported Excel file includes:
- Report header with period and date information
- All comparison metrics with actual vs target values
- Progress percentages and performance indicators
- Summary section with key metrics
- Proper column formatting and styling

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/edf65cac-663e-407d-b06b-971f0477f4b2) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.
 
Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
