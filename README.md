# **Redscrap**

Redscrap is a simple web scraper for various local job boards, designed to collect job postings efficiently.

## **Features**

- Scrapes job postings from multiple local job boards
- Supports database storage for structured data
- Uses proxy support for better reliability

## **Installation**

### **Prerequisites**

- [Node.js](https://nodejs.org/) (Recommended: LTS version)
- [pnpm](https://pnpm.io/) (Install with `npm install -g pnpm`)
- A PostgreSQL database

### **Clone the Repository**

```sh
git clone https://github.com/yourusername/redscrap.git
cd redscrap
```

### **Install Dependencies**

```sh
pnpm install
```

## **Configuration**

Before running Redscrap, you need to configure environment variables.

1. **Create a `.env` file** in the project root:

   ```sh
   touch .env
   ```

2. **Add the following variables to `.env`:**
   ```
   DATABASE_URL=your_postgres_connection_string
   PROXY_URLS="proxy1,proxy2,proxy3"  # Comma-separated list of proxies
   ```

## **Running Locally**

Once configured, start the scraper with:

```sh
pnpm run start
```

## **License**

This project is licensed under [MIT](LICENSE).
