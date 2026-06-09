const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;

const { exec } =
    require("child_process");

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post(
    "/api/sync",
    (req,res)=>{

        exec(
            'git add . && git commit -m "Auto Sync" && git push',
            (err,stdout,stderr)=>{

                if(err){

                    return res.json({

                        success:false,

                        error:
                            stderr
                    });
                }

                res.json({

                    success:true,

                    output:
                        stdout
                });
            }
        );
    }
);

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
                    success:false
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
            success:true
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
            success:true
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
    (req,res)=>{

        res.json(
            readJson(
                "reports"
            )
        );
    }
);

app.post(
    "/api/reports",
    (req,res)=>{

        const reports =
            readJson(
                "reports"
            );

        if(
            !reports.reports
        ){
            reports.reports=[];
        }

        reports.reports.unshift({

            id:Date.now(),

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
            success:true
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
    (req,res)=>{

        const result=[];

        USERS
        .filter(
            u =>
            u !==
            "master-task"
        )
        .forEach(user=>{

            const data=
                readJson(
                    user
                );

            if(
                data.tasks.length===0
            ){

                result.push({
                    user,
                    progress:0
                });

                return;
            }

            const avg=

                data.tasks.reduce(
                    (a,b)=>
                    a+b.progress,
                    0
                )/

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
    (req,res)=>{

        res.json(
            readJson(
                "activity-log"
            )
        );
    }
);

app.listen(
    PORT,
    ()=>{

        console.log(
            `Server running at http://localhost:${PORT}`
        );
    }
);