const express = require("express")
const fs = require("fs")

const app = express()

app.use(express.json())
app.use(express.static("public"))

const pedidosFile = "./database/pedidos.json"
const usuariosFile = "./database/usuarios.json"

let usuarioLogado = null

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

    const ok = usuarios.find(
        u => u.usuario == usuario && u.senha == senha
    )

    if(ok){
        usuarioLogado = usuario
        res.json({ok:true})
    }else{
        res.json({ok:false})
    }

})


// VERIFICAR LOGIN

app.get("/check",(req,res)=>{

    if(usuarioLogado){
        res.json({ok:true})
    }else{
        res.json({ok:false})
    }

})


// PEDIDOS

app.get("/pedidos",(req,res)=>{

    if(!usuarioLogado) return res.send([])

    res.json(ler(pedidosFile))

})


app.post("/pedidos",(req,res)=>{

    if(!usuarioLogado) return res.send("erro")

    const lista = ler(pedidosFile)

    const novo = req.body

    novo.id = Date.now()

    lista.push(novo)

    salvar(pedidosFile,lista)

    res.send("ok")

})


// EXCLUIR

app.post("/excluir",(req,res)=>{

    let lista = ler(pedidosFile)

    lista = lista.filter(p => p.id != req.body.id)

    salvar(pedidosFile,lista)

    res.send("ok")

})


const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{

    console.log("rodando",PORT)

})