const ExcelJS = require("exceljs");

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const { exec } =
    require("child_process");



app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const DATA_DIR =
    path.join(__dirname, "data");

const USERS = [
    "master-task",
    "khoa",
    "thai",
    "nhannghia",
    "trong",
    "doannghia"
];

function parseDeadline(deadline) {

    const parts =
        deadline.split("/");

    if (parts.length !== 3) {

        return new Date(deadline);
    }

    return new Date(
        Number(parts[2]),
        Number(parts[1]) - 1,
        Number(parts[0])
    );
}

function getFile(name) {

    return path.join(
        DATA_DIR,
        `${name}.json`
    );
}

function readJson(name) {

    const file = getFile(name);

    if (!fs.existsSync(file)) {

        return { tasks: [] };
    }

    return JSON.parse(
        fs.readFileSync(
            file,
            "utf8"
        )
    );
}

function writeJson(name, data) {

    fs.writeFileSync(
        getFile(name),
        JSON.stringify(
            data,
            null,
            4
        )
    );
}

function addLog(
    user,
    action,
    taskName = ""
) {

    const logs =
        readJson("activity-log");

    if (!logs.logs) {

        logs.logs = [];
    }

    logs.logs.unshift({

        id: Date.now(),

        user,

        action,

        taskName,

        time:
            new Date()
                .toLocaleString(
                    "vi-VN"
                )
    });

    writeJson(
        "activity-log",
        logs
    );
}

/*
====================
GET TASKS
====================
*/

app.get(
    "/api/tasks/:user",
    (req, res) => {

        const user =
            req.params.user;

        const data =
            readJson(user);

        res.json(data);
    }
);

/*
====================
ADD TASK
====================
*/

app.post(
    "/api/tasks/:user",
    (req, res) => {

        const user =
            req.params.user;

        const data =
            readJson(user);

        const task =
            req.body;

        task.id =
            Date.now();

        task.createdAt =
            new Date()
                .toISOString();

        if (
            task.progress < 0
        ) {
            task.progress = 0;
        }

        if (
            task.progress > 100
        ) {
            task.progress = 100;
        }

        data.tasks.push(task);

        writeJson(
            user,
            data
        );

        addLog(
            user,
            "CREATE",
            task.taskName
        );

        res.json({
            success: true
        });
    }
);

/*
====================
UPDATE TASK
====================
*/

app.put(
    "/api/tasks/:user/:id",
    (req, res) => {

        const user =
            req.params.user;

        const id =
            Number(
                req.params.id
            );

        const data =
            readJson(user);

        const task =
            data.tasks.find(
                t => t.id === id
            );

        if (!task) {

            return res
                .status(404)
                .json({
                    success: false
                });
        }

        Object.assign(
            task,
            req.body
        );

        if (
            task.progress < 0
        ) {
            task.progress = 0;
        }

        if (
            task.progress > 100
        ) {
            task.progress = 100;
        }

        writeJson(
            user,
            data
        );

        addLog(
            user,
            "UPDATE",
            task.taskName
        );

        res.json({
            success: true
        });
    }
);

/*
====================
DELETE TASK
====================
*/

app.delete(
    "/api/tasks/:user/:id",
    (req, res) => {

        const user =
            req.params.user;

        const id =
            Number(
                req.params.id
            );

        const data =
            readJson(user);

        const task =
            data.tasks.find(
                t => t.id === id
            );

        data.tasks =
            data.tasks.filter(
                t => t.id !== id
            );

        writeJson(
            user,
            data
        );

        addLog(
            user,
            "DELETE",
            task?.taskName || ""
        );

        res.json({
            success: true
        });
    }
);

/*
====================
REPORTS
====================
*/

app.get(
    "/api/reports",
    (req, res) => {

        res.json(
            readJson(
                "reports"
            )
        );
    }
);

app.post(
    "/api/reports",
    (req, res) => {

        const reports =
            readJson(
                "reports"
            );

        if (
            !reports.reports
        ) {
            reports.reports = [];
        }

        reports.reports.unshift({

            id: Date.now(),

            ...req.body,

            createdAt:
                new Date()
                    .toLocaleString(
                        "vi-VN"
                    )
        });

        writeJson(
            "reports",
            reports
        );

        res.json({
            success: true
        });
    }
);

/*
====================
PROGRESS
====================
*/

app.get(
    "/api/progress",
    (req, res) => {

        const result = [];

        USERS
            .filter(
                u =>
                    u !==
                    "master-task"
            )
            .forEach(user => {

                const data =
                    readJson(
                        user
                    );

                if (
                    data.tasks.length === 0
                ) {

                    result.push({
                        user,
                        progress: 0
                    });

                    return;
                }

                const avg =

                    data.tasks.reduce(
                        (a, b) =>
                            a + b.progress,
                        0
                    ) /

                    data.tasks.length;

                result.push({

                    user,

                    progress:
                        Math.round(
                            avg
                        )
                });
            });

        res.json(result);
    }
);

/*
====================
LOGS
====================
*/

app.get(
    "/api/logs",
    (req, res) => {

        res.json(
            readJson(
                "activity-log"
            )
        );
    }
);

/*
====================
GITHUB SYNC
====================
*/

app.post(
    "/api/sync",
    (req, res) => {

        exec(

            'git add . && git commit -m "Auto Sync" && git push origin main',

            {
                cwd: __dirname
            },

            (error, stdout, stderr) => {

                if (error) {

                    return res.json({

                        success: false,

                        error: error.message
                    });
                }

                res.json({

                    success: true,

                    output: stdout
                });
            }
        );
    }
);

/*
====================
IMPORT JSON
====================
*/

app.post(
    "/api/import",
    (req, res) => {

        const importData =
            req.body;

        if (
            !Array.isArray(importData)
        ) {

            return res.json({
                success: false
            });
        }

        let imported = 0;

        importData.forEach(group => {

            const target =
                group.target;

            const data =
                readJson(target);

            (group.tasks || [])
                .forEach(task => {

                    task.id =
                        Date.now() +
                        Math.floor(
                            Math.random() * 10000
                        );

                    task.createdAt =
                        new Date()
                            .toISOString();

                    data.tasks.push(task);

                    imported++;
                });

            writeJson(
                target,
                data
            );
        });

        addLog(
            "SYSTEM",
            "IMPORT JSON",
            `${imported} task`
        );

        res.json({

            success: true,

            imported
        });
    }
);

/*
====================
EXPORT EXCEL
====================
*/

app.get(
    "/api/export/excel",
    async (req, res) => {

        const data =
            readJson(currentFile || "master-task");

        const workbook =
            new ExcelJS.Workbook();

        const sheet =
            workbook.addWorksheet(
                "Tasks"
            );

        sheet.columns = [

            {
                header: "Tên Task",
                key: "taskName",
                width: 35
            },

            {
                header: "Người thực hiện",
                key: "assignee",
                width: 20
            },

            {
                header: "Nội dung",
                key: "description",
                width: 60
            },

            {
                header: "Deadline",
                key: "deadline",
                width: 15
            },

            {
                header: "Tiến độ",
                key: "progress",
                width: 15
            },

            {
                header: "Ghi chú",
                key: "note",
                width: 40
            },

            {
                header: "Trạng thái",
                key: "status",
                width: 18
            }
        ];
        sheet.getRow(1).eachCell(cell => {

            cell.font = {
                bold: true,
                color: {
                    argb: "FFFFFFFF"
                }
            };

            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                    argb: "FFD32F2F"
                }
            };

            cell.alignment = {
                horizontal: "center",
                vertical: "middle"
            };
        });

        const deadlineMap = {};

        let colorIndex = 0;

        data.tasks.forEach(task => {

            if (
                !deadlineMap[
                task.deadline
                ]
            ) {

                deadlineMap[
                    task.deadline
                ] =
                    colorIndex % 2 === 0
                        ? "FFCFE2F3"
                        : "FFEFEFEF";

                colorIndex++;
            }

            const row =
                sheet.addRow({

                    taskName:
                        task.taskName,

                    assignee:
                        task.assignee || "-",

                    description:
                        task.description,

                    deadline:
                        task.deadline,

                    progress:
                        `${task.progress}%`,

                    note:
                        task.note,

                    status:
                        task.status
                });

            const rowColor =
                deadlineMap[
                task.deadline
                ];

            row.eachCell(cell => {

                cell.fill = {

                    type: "pattern",

                    pattern: "solid",

                    fgColor: {
                        argb: rowColor
                    }
                };

                cell.border = {

                    top: {
                        style: "thin"
                    },

                    left: {
                        style: "thin"
                    },

                    bottom: {
                        style: "thin"
                    },

                    right: {
                        style: "thin"
                    }
                };

                cell.alignment = {

                    vertical:
                        "middle",

                    wrapText:
                        true
                };
            });
        });

                sheet.autoFilter = {

            from: "A1",

            to: "G1"
        };

        sheet.views = [

            {
                state: "frozen",
                ySplit: 1
            }
        ];

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=TeamTasks.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();
    }
);

        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Server running on port ${PORT}`
                );
            }
        );