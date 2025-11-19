import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { User } from "../models/user.model.js";
import { Organization } from "../models/organization.model.js";
import { Department } from "../models/department.model.js";
import { Project } from "../models/porject.model.js";
import { Task } from "../models/task.model.js";
import { Comment } from "../models/comment.model.js";

const connectDB = async () => {
    await mongoose.connect(process.env.MONGODBURL);
    console.log("DB Connected (Seed)");
}


const clearDB = async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Department.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});

    console.log("Old data cleared");
}


const createOrganization = async () => {
    try {
        const org = await Organization.create({
            name: "Abdullah Enterprise",
            billingEmail: "admin@abdullah.com",
            plan: "free"
        })

        console.log("Created org:", org._id.toString(), org.slug);

        return org
    } catch (error) {
        console.error(error, 'Created org error');
        throw error;
    }
}

const createdDepartment = async (org) => {
    try {
        const names = ["Web", "Mobile", "HR", "Finance"];
        const created = [];
        for (const name of names) {
            const depart = await Department.create({
                name,
                org: org._id
            })
            console.log('depertmane created:', name, depart?._id.toString())
            created.push(depart)
        }

        return created;
    } catch (error) {
        console.error('depertmane created error:', error)
        throw error
    }
}

const createUser = async (org, depts) => {
    const Users = [];

    const owner = await User.create({
        name: "Owner User",
        email: "owner@test.com",
        password: "Password123!",
        org: org._id,
        department: depts[0]._id,
        role: "owner"
    })
    console.log("Created owner:", owner._id);
    Users.push(owner);

    const manager = await User.create({
        name: "manager User",
        email: "manager@test.com",
        password: "Password123!",
        org: org._id,
        department: depts[1]._id,
        role: "manager"
    })
    console.log("Created manager:", manager._id);
    Users.push(manager);

    const employee = await User.create({
        name: "employee User",
        email: "employee@test.com",
        password: "Password123!",
        org: org._id,
        department: depts[2]._id,
        role: "employee"
    })
    console.log("Created employee:", employee._id);
    Users.push(employee);

    return Users;
}

const createProjects = async (org, users, depts) => {
    try {
        const projectsToCreate = [
            {
                name: "Website Revamp",
                org: org._id,
                department: depts.find(d => d.name === "Web")?._id,
                description: "Revamp company website for better UX.",
                members: [users[0]._id, users[2]._id], // owner + employee
                meta: { priority: "high" }
            },
            {
                name: "Mobile App",
                org: org._id,
                department: depts.find(d => d.name === "Mobile")?._id,
                description: "Build new mobile app v1.0",
                members: [users[0]._id, users[1]._id], // owner + manager
                meta: { priority: "medium" }
            }
        ];

        const created = [];
        for (const p of projectsToCreate) {
            const proj = await Project.create(p);
            console.log("Created project:", proj.name, proj._id.toString());
            created.push(proj);
        }
        return created;
    } catch (err) {
        console.error("createProjects error:", err);
        throw err;
    }
};
const createTasks = async (projects, users, depts) => {
    try {
        const createdTasks = [];

        for (const proj of projects) {
            // basic tasks array for each project
            const tasksForProject = [
                {
                    title: `Setup - ${proj.name}`,
                    description: `Initial setup for ${proj.name}`,
                    project: proj._id,
                    department: proj.department || depts.find(d => d.name === "Web")?._id,
                    assignee: users[2]._id, // employee
                    status: "todo",
                    priority: "high",
                    dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days
                },
                {
                    title: `Implementation - ${proj.name}`,
                    description: `Main implementation work for ${proj.name}`,
                    project: proj._id,
                    department: proj.department || depts.find(d => d.name === "Web")?._id,
                    assignee: users[1]._id, // manager
                    status: "in-progress",
                    priority: "medium",
                    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000), // 14 days
                },
                {
                    title: `QA & Wrap-up - ${proj.name}`,
                    description: `QA, fixes and closure for ${proj.name}`,
                    project: proj._id,
                    department: proj.department || depts.find(d => d.name === "Web")?._id,
                    assignee: users[0]._id, // owner or another user
                    status: "todo",
                    priority: "low",
                    dueDate: new Date(Date.now() + 21 * 24 * 3600 * 1000), // 21 days
                }
            ];

            for (const t of tasksForProject) {
                const created = await Task.create(t);
                console.log("Created task:", created.title, created._id.toString());
                createdTasks.push(created);
            }
        }

        return createdTasks;
    } catch (err) {
        console.error("createTasks error:", err);
        throw err;
    }
};

// ---------------------------
// STEP 3F — Comments Seeding
// ---------------------------
const createComments = async (tasks, users) => {
    try {
        const created = [];

        for (const t of tasks) {
            const c1 = await Comment.createWithIncrement({
                task: t._id,
                author: users[2]._id, // employee
                body: `This is a seed comment for ${t.title}`
            });

            console.log(
                "Created comment:",
                c1._id.toString(),
                "for task",
                t._id.toString()
            );

            created.push(c1);
        }

        return created;
    } catch (err) {
        console.error("createComments error:", err);
        throw err;
    }
};




const run = async () => {
    await connectDB();
    await clearDB();
    const org = await createOrganization();
    const depart = await createdDepartment(org);
    const users = await createUser(org, depart);
    const Projects = await createProjects(org, depart, users);
    const Task = await createTasks(Projects, users, depart);
    const comments = await createComments(Task, users);
    console.log("Seed step 3A done");
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1)
})
