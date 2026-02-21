# Battle Arena

A turn-based battle game built on Radix DLT with wallet integration.

## Project info

**URL**: https://hydra/battlearena.vercel.app

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd battlearena

# Step 3: Install the necessary dependencies
npm i

# Step 4: Start the development server
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
- @radixdlt/radix-dapp-toolkit

## Radix Wallet Integration

This project uses the [Radix dApp Toolkit](https://github.com/radixdlt/radix-dapp-toolkit) to connect with the Radix Wallet.

Users need the [Radix Wallet](https://wallet.radixdlt.com/) and the [Radix Connector browser extension](https://chrome.google.com/webstore/detail/radix-wallet-connector/bfeplaecgkoeckiidkgkmlllfbaeplgm) to connect their wallet to this dApp.

## How can I deploy this project?

You can deploy this project to any hosting platform that supports static sites (Vercel, Netlify, etc.).

Build the project with:

```sh
npm run build
```

Then deploy the `dist` folder.
