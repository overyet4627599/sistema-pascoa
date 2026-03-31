from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
import json

app = Flask(__name__)
app.secret_key = "chave-secreta-supersegura"

# Criar banco de dados se não existir e adicionar usuário padrão
def init_db():
    with sqlite3.connect("pedidos.db") as conn:
        c = conn.cursor()
        # Criação das tabelas
        c.execute("""
            CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cliente TEXT NOT NULL,
                rota TEXT NOT NULL,
                dataentrega TEXT NOT NULL,
                itens TEXT NOT NULL
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL
            )
        """)
        conn.commit()

        # Inserir usuário padrão "tiago" se não existir
        try:
            c.execute("INSERT INTO usuarios (usuario, senha) VALUES (?, ?)", ("tiago", "12345678"))
            conn.commit()
        except sqlite3.IntegrityError:
            # Usuário já existe, não faz nada
            pass

init_db()

@app.route("/")
def home():
    if "usuario" not in session:
        return redirect(url_for("login_page"))
    return render_template("dashboard.html")

@app.route("/index.html")
def novo_pedido():
    if "usuario" not in session:
        return redirect(url_for("login_page"))
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    if "usuario" not in session:
        return redirect(url_for("login_page"))
    return render_template("dashboard.html")

@app.route("/entregas")
def entregas():
    if "usuario" not in session:
        return redirect(url_for("login_page"))
    return render_template("entregas.html")

@app.route("/pedidos", methods=["POST"])
def salvar_pedido():
    if "usuario" not in session:
        return jsonify({"status": "unauthorized"}), 401
    dados = request.get_json()
    with sqlite3.connect("pedidos.db") as conn:
        c = conn.cursor()
        c.execute(
            "INSERT INTO pedidos (cliente, rota, dataentrega, itens) VALUES (?, ?, ?, ?)",
            (dados["cliente"], dados["rota"], dados["dataentrega"], json.dumps(dados["itens"]))
        )
        conn.commit()
    return jsonify({"status": "ok"})

@app.route("/editar", methods=["POST"])
def editar_pedido():
    if "usuario" not in session:
        return jsonify({"status": "unauthorized"}), 401
    dados = request.get_json()
    with sqlite3.connect("pedidos.db") as conn:
        c = conn.cursor()
        c.execute(
            "UPDATE pedidos SET cliente=?, rota=?, dataentrega=?, itens=? WHERE id=?",
            (dados["cliente"], dados["rota"], dados["dataentrega"], json.dumps(dados["itens"]), dados["id"])
        )
        conn.commit()
    return jsonify({"status": "ok"})

@app.route("/pedidos", methods=["GET"])
def listar_pedidos():
    if "usuario" not in session:
        return jsonify({"status": "unauthorized"}), 401
    with sqlite3.connect("pedidos.db") as conn:
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM pedidos")
        pedidos = [
            {
                "id": row["id"],
                "cliente": row["cliente"],
                "rota": row["rota"],
                "dataentrega": row["dataentrega"],
                "itens": row["itens"]
            }
            for row in c.fetchall()
        ]
    return jsonify(pedidos)

@app.route("/excluir", methods=["POST"])
def excluir_pedido():
    if "usuario" not in session:
        return jsonify({"status": "unauthorized"}), 401
    dados = request.get_json()
    with sqlite3.connect("pedidos.db") as conn:
        c = conn.cursor()
        c.execute("DELETE FROM pedidos WHERE id=?", (dados["id"],))
        conn.commit()
    return jsonify({"status": "ok"})

@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")

@app.route("/login", methods=["POST"])
def login_action():
    dados = request.get_json()
    usuario = dados.get("usuario")
    senha = dados.get("senha")

    with sqlite3.connect("pedidos.db") as conn:
        c = conn.cursor()
        c.execute("SELECT * FROM usuarios WHERE usuario=? AND senha=?", (usuario, senha))
        user = c.fetchone()

    if user:
        session["usuario"] = usuario
        return jsonify({"ok": True, "redirect": "/"})
    else:
        return jsonify({"ok": False, "erro": "Usuário ou senha inválidos"})

@app.route("/register", methods=["POST"])
def register_action():
    dados = request.get_json()
    usuario = dados.get("usuario")
    senha = dados.get("senha")

    try:
        with sqlite3.connect("pedidos.db") as conn:
            c = conn.cursor()
            c.execute("INSERT INTO usuarios (usuario, senha) VALUES (?, ?)", (usuario, senha))
            conn.commit()
        return jsonify({"ok": True})
    except sqlite3.IntegrityError:
        return jsonify({"ok": False, "erro": "Usuário já existe"})

@app.route("/logout")
def logout():
    session.pop("usuario", None)
    return redirect(url_for("login_page"))

if __name__ == "__main__":
    app.run(debug=True)