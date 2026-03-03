require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const movies = require("./movies.js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const PORT = process.env.SERVER_PORT || 4242;


app.get("/movies", (req, res) => {
    res.json(movies);
});


app.get("/movies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const movie = movies.find((m) => m.id === id);
    
    if (!movie) {
        return res.status(404).json({message: "Movie not found"});
    }

    res.status(200).json({ data: movie});
});


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

app.delete("/movies/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = movies.findIndex((m) => m.id === id);

    if (index === -1) {
    return res.status(404).json({message: "Movie not Found"});
  }

  movies.splice(index, 1);
  res.status(200).json({message: "Movie deleted"});
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