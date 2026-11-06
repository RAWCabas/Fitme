import fs from "fs";
import crypto from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

if (fs.existsSync(".env.local")) {
  const lines = fs.readFileSync(".env.local", "utf-8").split("\n");
  for (const l of lines) {
    if (l.includes("=") && !l.trim().startsWith("#")) {
      const idx = l.indexOf("=");
      const key = l.slice(0, idx).trim();
      const val = l.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      process.env[key] = val;
    }
  }
}

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "ap-southeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const doc = DynamoDBDocumentClient.from(client);
const TableName = process.env.DYNAMODB_TABLE_NAME || "fitme-main";

const targetUserIds = [
  "890e4418-5051-708a-54a8-61a0846f89d4",
  "dev_user_7268696e6e61",
  "39de6478-40a1-70de-85f6-fa745ecc265d"
];

const fullName = "Rhinn Anthon William D. Cabas";
const email = "rhinnanthon@gmail.com";

async function main() {
  console.log("Starting Rhinn Cabas profile & mock data integration in DynamoDB...");

  for (const userId of targetUserIds) {
    const pk = `USER#${userId}`;
    const sk = "PROFILE";

    // Build fresh dual-track profile with valid UUIDs and full name with middle initial "D."
    const profileItem = {
      PK: pk,
      SK: sk,
      entityType: "PROFILE",
      userId,
      contact: {
        fullName,
        headline: "Computer Engineer | Embedded Systems & Edge AI | IT & Technical Support",
        email,
        phone: "0945-350-7389",
        location: "Deca Homes, Cubacub, Mandaue City, Cebu",
        portfolioUrl: "https://github.com/RAWCabas",
        linkedinUrl: "https://linkedin.com/in/rhinnanthon",
        githubUrl: "https://github.com/RAWCabas",
      },
      summary:
        "Analytical Computer Engineering graduate specializing in smart automation, embedded systems, and machine learning integration alongside strong foundations in hardware maintenance, systems troubleshooting, and network operations. Demonstrates hands-on expertise in hardware prototyping, 3D mechanical modeling, deploying Edge AI and computer vision solutions, and delivering dependable on-site and remote technical support across distributed teams and enterprise systems.",
      experiences: [
        {
          id: crypto.randomUUID(),
          company: "Sustainable Center for Engineering and Next-Generation Technology",
          role: "Project Research Assistant (Internship)",
          location: "Cebu, Philippines",
          startDate: "2026-01-01",
          endDate: null,
          isHidden: false,
          bullets: [
            {
              id: crypto.randomUUID(),
              content: "Engineered detailed 3D designs and mechanical modeling for project hardware, optimizing structural integrity for physical enclosures.",
              isHidden: false,
              hasMetrics: true,
            },
            {
              id: crypto.randomUUID(),
              content: "Collaborated closely on embedded programming and machine learning model training utilizing Edge Impulse for real-time edge computing deployment.",
              isHidden: false,
              hasMetrics: true,
            },
            {
              id: crypto.randomUUID(),
              content: "Conducted system-level diagnostics, hardware assembly, and sensor integration for IoT embedded prototypes.",
              isHidden: false,
              hasMetrics: false,
            },
          ],
        },
        {
          id: crypto.randomUUID(),
          company: "McDonald's Philippines",
          role: "Customer Service Crew",
          location: "Cebu, Philippines",
          startDate: "2022-06-01",
          endDate: "2023-08-01",
          isHidden: false,
          bullets: [
            {
              id: crypto.randomUUID(),
              content: "Delivered prompt, customer-focused service in a high-volume environment, consistently achieving store satisfaction targets.",
              isHidden: false,
              hasMetrics: true,
            },
            {
              id: crypto.randomUUID(),
              content: "Operated POS terminals, balanced cash drawers with 100% accuracy, and resolved customer escalations calmly.",
              isHidden: false,
              hasMetrics: true,
            },
            {
              id: crypto.randomUUID(),
              content: "Maintained food safety compliance and sanitation standards across kitchen and dining zones.",
              isHidden: false,
              hasMetrics: false,
            },
          ],
        },
      ],
      projects: [
        {
          id: crypto.randomUUID(),
          name: "Edge AI & Hardware Prototyping (SCENG)",
          description: "Embedded machine learning deployment using Edge Impulse, custom sensor integration, and 3D enclosure modeling.",
          technologies: ["Edge Impulse", "Embedded C++", "IoT Sensors", "Fusion 360", "Edge Computing"],
          liveUrl: "",
          repoUrl: "https://github.com/RAWCabas",
          isHidden: false,
          bullets: [
            {
              id: crypto.randomUUID(),
              content: "Built an on-device Edge AI inference pipeline processing real-time sensor streams with under 100ms latency.",
              isHidden: false,
              hasMetrics: true,
            },
            {
              id: crypto.randomUUID(),
              content: "Fabricated functional 3D enclosures ensuring thermal dissipation and mechanical durability for deployed field nodes.",
              isHidden: false,
              hasMetrics: false,
            },
          ],
        },
        {
          id: crypto.randomUUID(),
          name: "Computer Systems Servicing & Network Infrastructure",
          description: "End-to-end hardware assembly, OS deployment, network configuration, and diagnostic bench testing.",
          technologies: ["Windows Server", "Linux", "LAN Routing", "Hardware Diagnostics", "System Recovery"],
          liveUrl: "",
          repoUrl: "",
          isHidden: false,
          bullets: [
            {
              id: crypto.randomUUID(),
              content: "Configured and provisioned local area networks (LAN), static routing, subnetting, and secure gateway access.",
              isHidden: false,
              hasMetrics: false,
            },
            {
              id: crypto.randomUUID(),
              content: "Executed component-level hardware diagnostics, component replacements, and preventative maintenance on 50+ workstations.",
              isHidden: false,
              hasMetrics: true,
            },
          ],
        },
      ],
      education: [
        {
          id: crypto.randomUUID(),
          institution: "Cebu Technological University- Main Campus",
          degree: "Bachelor of Science in Computer Engineering",
          fieldOfStudy: "Computer Engineering",
          startDate: "2020",
          endDate: "2024",
          level: "college",
          honors: "",
          isHidden: false,
        },
      ],
      certifications: [
        {
          id: crypto.randomUUID(),
          name: "TESDA Computer Systems Servicing NC II",
          issuer: "Technical Education and Skills Development Authority (TESDA)",
          issueDate: "2024-05-15",
          expiryDate: null,
          credentialId: "TESDA-CSS-NCII-2024",
          credentialUrl: "",
          hours: "280 Hours",
          isHidden: false,
        },
        {
          id: crypto.randomUUID(),
          name: "Microsoft Certified: Power Platform Fundamentals (PL-900)",
          issuer: "Microsoft",
          issueDate: "2024-08-20",
          expiryDate: null,
          credentialId: "MS-PL900-2024",
          credentialUrl: "",
          hours: "",
          isHidden: false,
        },
        {
          id: crypto.randomUUID(),
          name: "AWS Certified Cloud Practitioner",
          issuer: "Amazon Web Services",
          issueDate: "2024-11-10",
          expiryDate: null,
          credentialId: "AWS-CCP-2024",
          credentialUrl: "",
          hours: "",
          isHidden: false,
        },
      ],
      skills: [
        { id: crypto.randomUUID(), name: "Java", category: "languages", isHidden: false },
        { id: crypto.randomUUID(), name: "C / C++", category: "languages", isHidden: false },
        { id: crypto.randomUUID(), name: "Python", category: "languages", isHidden: false },
        { id: crypto.randomUUID(), name: "TypeScript / JavaScript", category: "languages", isHidden: false },
        { id: crypto.randomUUID(), name: "SQL", category: "languages", isHidden: false },
        { id: crypto.randomUUID(), name: "React / Next.js", category: "frameworks", isHidden: false },
        { id: crypto.randomUUID(), name: "Node.js", category: "frameworks", isHidden: false },
        { id: crypto.randomUUID(), name: "Edge Impulse", category: "frameworks", isHidden: false },
        { id: crypto.randomUUID(), name: "Embedded Systems & IoT", category: "tools", isHidden: false },
        { id: crypto.randomUUID(), name: "Hardware Diagnostics & Repair", category: "tools", isHidden: false },
        { id: crypto.randomUUID(), name: "Network Configuration (LAN/TCP/IP)", category: "tools", isHidden: false },
        { id: crypto.randomUUID(), name: "3D Modeling & Mechanical Design", category: "tools", isHidden: false },
        { id: crypto.randomUUID(), name: "AWS Cloud (DynamoDB, Bedrock, S3, Cognito)", category: "cloud", isHidden: false },
        { id: crypto.randomUUID(), name: "Technical Support & Troubleshooting", category: "tools", isHidden: false },
        { id: crypto.randomUUID(), name: "Customer Communication & Escalation", category: "tools", isHidden: false },
      ],
      hiddenContactFields: [],
      updatedAt: new Date().toISOString(),
    };

    await doc.send(new PutCommand({ TableName, Item: profileItem }));
    console.log(`Saved PROFILE for ${userId} with fullName: "${profileItem.contact.fullName}"`);

    // Now seed the IT Technical Support Job Opportunity
    const jobId = crypto.randomUUID();
    const jobItem = {
      PK: pk,
      SK: `JOB#${jobId}`,
      entityType: "JOB",
      id: jobId,
      userId,
      company: "Mactan Rock Industries Inc.",
      role: "IT Technical Support",
      location: "Mandaue City, Cebu",
      sourceUrl: "https://mactanrock.com/careers",
      rawDescription: "Seeking an IT Technical Support specialist to manage workstation diagnostics, LAN infrastructure, server operations, and helpdesk support across manufacturing facilities.",
      extractedSkills: ["Technical Support", "Troubleshooting", "Hardware Maintenance", "LAN Configuration", "Helpdesk"],
      mustHaves: ["Computer Systems Servicing NC II or equivalent", "Experience with workstation assembly and network routing"],
      niceToHaves: ["Customer service communication skills"],
      createdAt: new Date().toISOString(),
    };
    await doc.send(new PutCommand({ TableName, Item: jobItem }));
    console.log(`Saved JOB for ${userId} at ${jobItem.company}`);

    // Now seed the Tailored Resume with 100% ATS score and "sent" lifecycle status
    const resumeId = crypto.randomUUID();
    const resumeItem = {
      PK: pk,
      SK: `RESUME#${jobId}#${resumeId}`,
      GSI1PK: `USER#${userId}#STATUS#sent`,
      GSI1SK: new Date().toISOString(),
      entityType: "RESUME",
      id: resumeId,
      userId,
      jobOpportunityId: jobId,
      title: "IT Technical Support",
      versionNumber: 1,
      status: "sent",
      preset: "modern_standard",
      pageBudget: "1_page",
      fitScore: {
        score: 100,
        matchedCount: 5,
        missingCount: 0,
        keywords: [
          { keyword: "Technical Support", presentInResume: true, count: 4, category: "skill" },
          { keyword: "Hardware Diagnostics", presentInResume: true, count: 3, category: "skill" },
          { keyword: "Network Maintenance", presentInResume: true, count: 2, category: "skill" },
          { keyword: "Troubleshooting", presentInResume: true, count: 5, category: "skill" },
          { keyword: "Computer Systems Servicing", presentInResume: true, count: 2, category: "certification" },
        ],
        summaryEvaluation: "Exceptional 100% ATS keyword match for Mactan Rock Industries Inc. IT Technical Support position.",
      },
      tailoredSummary: "Results-oriented Computer Engineering professional with demonstrated expertise in Technical Support, Hardware Maintenance, and Troubleshooting. Proven track record of delivering high-impact operational uptime and network reliability.",
      tailoredExperiences: [
        {
          id: crypto.randomUUID(),
          company: "Sustainable Center for Engineering and Next-Generation Technology",
          role: "IT & Systems Support Intern",
          location: "Cebu, Philippines",
          startDate: "2026-01-01",
          endDate: null,
          bullets: [
            {
              id: crypto.randomUUID(),
              content: "Delivered technical support, system diagnostics, and hardware maintenance for workstation fleets and testing nodes.",
            },
            {
              id: crypto.randomUUID(),
              content: "Maintained local network infrastructure, troubleshooting router and switch connectivity with zero unplanned downtime.",
            },
          ],
        },
      ],
      tailoredProjects: [],
      tailoredEducation: [
        {
          id: crypto.randomUUID(),
          institution: "Cebu Technological University- Main Campus",
          degree: "Bachelor of Science in Computer Engineering",
          fieldOfStudy: "Computer Engineering",
          startDate: "2020",
          endDate: "2024",
          level: "college",
          honors: "",
        },
      ],
      tailoredCertifications: [
        {
          id: crypto.randomUUID(),
          name: "TESDA Computer Systems Servicing NC II",
          issuer: "TESDA",
          issueDate: "2024-05-15",
          expiryDate: null,
          credentialId: "TESDA-CSS-NCII-2024",
          credentialUrl: "",
          hours: "280 Hours",
        },
      ],
      selectedSkills: [
        { id: crypto.randomUUID(), name: "Technical Support & Troubleshooting", category: "tools", isHidden: false },
        { id: crypto.randomUUID(), name: "Hardware Diagnostics & Assembly", category: "tools", isHidden: false },
        { id: crypto.randomUUID(), name: "Network Configuration (LAN / TCP/IP)", category: "tools", isHidden: false },
        { id: crypto.randomUUID(), name: "Workstation Maintenance", category: "tools", isHidden: false },
      ],
      pdfS3Key: `resumes/${userId}/it-technical-support-mactan-rock.pdf`,
      pdfPresignedUrl: null,
      markdownContent: `# Rhinn Anthon William D. Cabas\n**IT Technical Support** | Mactan Rock Industries Inc.\n\n- Technical Support & Hardware Maintenance`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await doc.send(new PutCommand({ TableName, Item: resumeItem }));
    console.log(`Saved TAILORED RESUME for ${userId} ("IT Technical Support - Mactan Rock")`);
  }

  console.log("Migration complete!");
}

main().catch(console.error);

