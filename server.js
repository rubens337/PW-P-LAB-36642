require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prima = new PrismaClient();
 
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

app.post("/prisma/tasks", async (req, res) => {
    try {
        const createdTasks = [];

        for (const t of tasks) {
            const newTask = await Prisma.task.create({
                data: {
                    title : t.title,
                    completed: t.completed,
                    priority: t.priority
                }
            });
            createdTasks.push(newTask);
        }
        res.status(201).json({message: "Tasks created!", data: createdTasks});
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "Erro ao importar as tasks"})
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