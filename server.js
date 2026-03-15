const express = require("express")
const fs = require("fs")
const path = require("path")

const app = express()

app.use(express.json())
app.use(express.static("public"))

const pedidosFile = "./database/pedidos.json"
const usuariosFile = "./database/usuarios.json"

function ler(file){
    return JSON.parse(fs.readFileSync(file))
}

function salvar(file,dados){
    fs.writeFileSync(file, JSON.stringify(dados,null,2))
}

// LOGIN

app.post("/login",(req,res)=>{

    const {usuario,senha} = req.body

    const usuarios = ler(usuariosFile)

    const ok = usuarios.find(u=>u.usuario==usuario && u.senha==senha)

    if(ok){
        res.json({ok:true})
    }else{
        res.json({ok:false})
    }

})

// PEDIDOS

app.get("/pedidos",(req,res)=>{

    res.json(ler(pedidosFile))

})

app.post("/pedidos",(req,res)=>{

    const lista = ler(pedidosFile)

    lista.push(req.body)

    salvar(pedidosFile,lista)

    res.send("ok")

})

// PORTA RENDER

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{

    console.log("rodando",PORT)

})