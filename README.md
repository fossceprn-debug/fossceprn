# FOSS CEPrn

### The digital home of FOSS CEPrn.

FOSS CEPrn is the official web platform of the Free and Open Source Software community at College of Engineering Perumon.

The platform brings the community together by providing information about its activities, events, projects, members and initiatives. It also provides dedicated dashboards for managing organisational activities and internal operations.

Built by the community, for the community. ❤️

---

## About

FOSS CEPrn is a student-driven initiative that promotes Free and Open Source Software, collaborative learning and technology within the campus.

This repository contains the source code of the FOSS CEPrn website and its management platform. The project is publicly available so that developers, students and contributors can explore the code, report issues, suggest improvements and contribute to its development.

## Features

- **Community Website** – Information about FOSS CEPrn, its activities and initiatives.
- **Member Management** – Manage community member information.
- **ExeCom Management** – Organisational management for Executive Committee members.
- **Faculty Management** – Faculty-related information and access.
- **Event Management** – Create and manage events and registrations.
- **QR-based Attendance** – Support for event attendance tracking.
- **Project Showcase** – Showcase projects and community contributions.
- **Gallery** – Collection of community events and activities.
- **Announcements** – Publish important community updates.
- **Admin Dashboard** – Manage website content and organisational operations.

## Tech Stack

This project is built using:

| Technology | Purpose |
|---|---|
| React | Frontend library |
| TypeScript | Type-safe development |
| Vite | Development and build tooling |
| Tailwind CSS | Styling |
| Supabase | Authentication and backend services |
| PostgreSQL | Database |

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git
- A Supabase project for local development

### 1. Clone the repository

```bash
git clone https://github.com/fossceprn-debug/fossceprn.git
```

### 2. Navigate to the project directory

```bash
cd fossceprn
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file in the project root.

Copy the example configuration:

```bash
cp .env.example .env
```

Add your own development Supabase project credentials to the `.env` file.

Never use production credentials or commit your `.env` file to GitHub.

### 5. Start the development server

```bash
npm run dev
```

The application will be available at the local URL displayed in your terminal.

### 6. Build for production

```bash
npm run build
```

## Project Structure

```text
fossceprn/
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
├── supabase/
│   └── migrations/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

The structure above provides a high-level overview; refer to the repository for the complete source tree.

## Contributing

Contributions are welcome!

Whether you're fixing a bug, improving the interface, updating documentation or suggesting a feature, your contributions can help improve the project.

To contribute:

1. Fork this repository.
2. Create a new branch for your changes.
3. Make your changes and test them.
4. Commit your changes with a meaningful commit message.
5. Open a Pull Request explaining your changes.

Please make sure your contributions are relevant to the project and follow its existing coding conventions.

## Security

Security is important to this project.

- Never commit API secrets, passwords or private credentials.
- Never upload production database backups or private member information.
- Do not expose Supabase service-role keys in frontend code.
- Report security vulnerabilities responsibly rather than publishing exploit details.

See [SECURITY.md](SECURITY.md) for reporting instructions, if available.

## Project Scope

This project is developed specifically for the FOSS CEPrn community at College of Engineering Perumon.

Making the source code open source allows the wider developer community to inspect, learn from and contribute to the project. It does not provide access to the organisation's private systems, production database or administrative accounts.

## Licence

This project is intended to be released under the MIT License.

See the [LICENSE](LICENSE) file for details.

## Acknowledgements

Developed and maintained by the FOSS CEPrn community.

Thanks to everyone who contributes their time, ideas and efforts towards making this project better.

---

**FOSS CEPrn**  
*Learn. Build. Share. Contribute.*

