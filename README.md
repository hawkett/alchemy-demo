# Overview

This app is a basic SaaS app that provisions infrasturcture using alchemy.

The basic flow is:
- deploy the `saas-website` with alchemy
- customer chooses to create an account the website
- cloudflare worker uses alchemy to provision a custom infra stack for the customer (this repo simulates this by creating an R2 bucket)
- every customer gets their own R2 state store.

## Structure

-   `apps/saas-website`: A Vite + React + Cloudflare Workers application that displays random word pairs and allows provisioning of customer accounts.
-   `packages/account-infra`: A library for provisioning R2 buckets for customer accounts using Alchemy, with Alchemy state stored in a designated R2 bucket.

