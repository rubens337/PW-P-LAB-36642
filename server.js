require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
 
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const movies = require("./movies.js");
const tasks = require("./tasks.js");
const { parse } = require("dotenv");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.SERVER_PORT || 4242;

//lista todos os filmes registados
app.get("/movies", (req, res) => {
    res.json(movies);
});

//mostra um determinado filme escolhido por id
app.get("/movies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const movie = movies.find((m) => m.id === id);
    
    if (!movie) {
        return res.status(404).json({message: "Movie not found"});
    }

    res.status(200).json({ data: movie});
});

//adiciona um novo filme
app.post("/movies", (req, res) => {
    const {title, year} = req.body;

    //validar
    if (!title || !year) {
        return res.status(400).json({ message: "Campos 'title' e 'year' são obrigatorios"});
    }

    const newMovie = {
        id: movies.length > 0 ? movies[movies.length - 1].id + 1 : 1, 
        title, 
        year
    };
    
    movies.push(newMovie);
    res.status(201).json({data: newMovie });
});

//atualizar um filme ja existente
app.put("/movies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = movies.findIndex((m) => m.id === id);

    if (index === -1) {
        return res.status(404).json({message: "Movie not found"});
    }

    const {title, year} = req.body;

    if (!title || !year) {
        return res.status(400).json({message: "Campos 'title' e 'year' são obrigatorios"});
    }

    movies[index] = {id, title, year};
    res.status(200).json({data: movies[index] });
});

//apagar um filme
app.delete("/movies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = movies.findIndex((m) => m.id === id);

    if (index === -1) {
    return res.status(404).json({message: "Movie not Found"});
  }

  movies.splice(index, 1);
  res.status(200).json({message: "Movie deleted"});
});



//mostra uma task escolhida pelo id
app.get("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const task = tasks.find((t) => t.id === id);

    if(!task) {
        return res.status(404).json({message: "Task not found"});
    }

    res.status(200).json({data: task});
});

// lista todas as tasks, com filtro de conclusão
app.get("/tasks", (req, res) => {
    console.log("Query recebido:", req.query);
    const {completed} = req.query;

    let result = tasks;

    if(completed !== undefined) {
        result =tasks.filter(t => String(t.completed) === completed);
    }

    res.status(200).json({data: result});
    
});

//adicionar uma nova task
app.post("/tasks", (req, res) => {
    const {title, completed, priority} = req.body;

    if(!title || !completed || !priority) {
         return res.status(400).json({ message: "Campos 'title' , 'completed' e 'priority' são obrigatorios"});
    }

    const newTask = {
        id: tasks.length > 0 ? tasks[tasks.length -1].id +1 : 1, title, completed, priority
    };

    tasks.push(newTask);
    res.status(201).json({data: newTask});
});

//atualizar uma task especifica
app.put("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
        return res.status(404).json({message: "Task not found"});
    }

    const {title, completed, priority} = req.body;

    if(!title || completed == undefined || !priority) {
         return res.status(400).json({ message: "Campos 'title' , 'completed' e 'priority' são obrigatorios"});
    }

    tasks[index] = {id, title, completed, priority};
    res.status(200).json({data: tasks[index]});
});

//patch alternar estado
app.patch("/tasks/:id/toggle", (req, res) => {
    const {id} = req.params;

    const task = tasks.find((t) => t.id === Number(id));

    if (!task) {
        return res.status(404).json({message: "Task not found!"});
    }

    task.completed = !task.completed;
    return res.status(200).json({data: task});
});

//apagar task especifica
app.delete("/tasks/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
        return res.status(404).json({message: "Task not found"});
    }

    tasks.splice(index, 1);
    res.status(200).json({message: "Task Deleted"});
});


//rotas tasks prisma

//importar as tasks do lab2 para a base de dados do prisma
app.post("/importar/prisma/tasks", async (req, res) => {
    try {
        const createdTasks = [];

        for (const t of tasks) {
            const newTask = await prisma.task.create({
                data: {
                    title : t.title,
                    completed: t.completed,
                    priority: t.priority
                }
            });
            createdTasks.push(newTask);
        }
        res.status(201).json({message: "Tasks criadas!", data: createdTasks});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Erro ao importar as tasks"})
    }
});



//lista todas as tasks da base de dados
app.get("/prisma/tasks", async (req, res) => {
    try {
        const {completed} = req.query;

        const tasks = await prisma.task.findMany({
            where: completed !== undefined ? {
                completed: completed === "true"
            } : {}
        });
        res.status(200).json(tasks);
    } catch (error) {
        console.error("Erro ao obter tasks:", error);
        res.status(500).json({message: "Erro ao obter tasks"});
    }
});

//lista uma task especifica da base de dados
app.get("/prisma/tasks/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const task = await prisma.task.findUnique({
            where: { id: Number(id) }
        });
        if (!task) {
            return res.status(404).json({message: "Task não encontrada"});
        }
        
        res.status(200).json(task);
    } catch (error) {
        console.error("Erro ao obter task:", error);
        res.status(500).json({message: "Erro ao obter task"});
    }
});

//atualizar uma task especifica
app.put("/prisma/tasks/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const {title, completed, priority} = req.body;

        const taskExist = await prisma.task.findUnique({
            where: { id: Number(id)}
        });
        if (!taskExist) {
            return res.status(404).json({message: "task nao encontrada"});
        }

        const updatedTask = await prisma.task.update({
            where: { id: Number(id)},
            data: { 
                title: title ?? taskExist.title, 
                completed: completed ?? taskExist.completed, 
                priority: priority ?? taskExist.priority}
        });
        
        res.status(200).json(updatedTask);
    } catch (error) {
        console.error("Erro ao atualizar task: ", error);
        res.status(500).json({message: "Erro ao atualizar task"});
    }
});

//criar nova task
app.post("prisma/tasks", async (req, res) => {
    try {
        const {title, completed, priority} = req.body;

        if (!title) {
            return res.status(400).json({message: "Campo 'title' é obrigatorio"});
        }

        const newTask = await prisma.task.create({
            data: {
                title,
                completed: completed ?? false,
                priority: priority ?? "normal"
            }
        });
        return res.status(201).json(newTask);

    } catch (error) {
        console.error("Erro ao criar task: ", error);
        res.status(500).json({message: "Erro ao criar task"});
    }
});

//apagar uma task
app.delete("/prisma/tasks/:id", async (req, res) => {
    try {
        const {id} = req.params;
        const taskId = Number(id);

        const deleteTask = await prisma.task.delete({
            where: { id: taskId}
        });
        res.status(204).json({message: "Task apagada"});

    } catch (error){
        console.error("Erro ao apagar task: ", error);
        res.status(500).json({message: "Erro ao apagar task"});
    }
});

//patch alternar estado prisma
app.patch("/prisma/tasks/:id/toggle", async (req, res) => {
    try{
        const {id} = req.params;
        const taskId = Number(id);

        const task = await prisma.tasl.findUnique({
            where: { id: taskId}
        });

        if (!task) {
            return res.status(404).json({message: "task nao encontrada"});
        }

        const novoEstado = !task.completed;

        const updatedTask = await prisma.task.update({
            where: { id: taskId},
            data: { completed: novoEstado}
        });
        res.status(200).json(updatedTask);

    } catch (error) {
        console.error("Erro ao alternar estado: ", error);
        res.status(500).json({message: "Erro ao alternar estado"});
    }
});



// Rota não encontrada (404)
app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

// Middleware de erro global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erro interno do servidor" });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor a correr em http://localhost:${PORT}`);
});