import random
import sys
import tkinter as tk
from tkinter import messagebox

class CaraDasResenhasApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Cara das Resenhas: MODO TROLL SUPREMO")
        self.root.geometry("650x550")
        self.root.configure(bg="#0d0d0d")
        
        self.tentativas = 0
        self.max_tentativas = 5
        self.chaves_encontradas = 0
        self.sanidade = 100
        
        self.setup_ui()
        
    def setup_ui(self):
        self.clear_frame()
        
        # Header / Título
        lbl_title = tk.Label(
            self.root, 
            text="🏠 CASA ASSOMBRADA DO CARA DAS RESENHAS 🤡", 
            font=("Impact", 20, "bold"), 
            fg="#ff3333", 
            bg="#0d0d0d"
        )
        lbl_title.pack(pady=15)
        
        lbl_status = tk.Label(
            self.root, 
            text=f"Dia: {self.tentativas + 1}/{self.max_tentativas} | Chaves Roubadas: {self.chaves_encontradas}/3 | Sanidade: {self.sanidade}%", 
            font=("Arial", 12, "bold"), 
            fg="#00ffcc", 
            bg="#0d0d0d"
        )
        lbl_status.pack(pady=5)
        
        lbl_desc = tk.Label(
            self.root, 
            text="Cuidado! O Cara das Resenhas está a rondar a casa à procura de alguém para 'trocar uma ideia'...", 
            font=("Arial", 10, "italic"), 
            fg="#888888", 
            bg="#0d0d0d"
        )
        lbl_desc.pack(pady=10)
        
        # Botões de Ação Troll
        btn_opts = {
            "font": ("Arial", 11, "bold"), 
            "width": 38, 
            "pady": 8, 
            "bd": 3, 
            "relief": "raised", 
            "cursor": "hand2"
        }
        
        tk.Button(self.root, text="🔍 Procurar na gaveta das cuecas", bg="#22223b", fg="#ffffff", activebackground="#4a4e69", command=lambda: self.acao("gaveta"), **btn_opts).pack(pady=6)
        tk.Button(self.root, text="🛋️ Olhar debaixo do sofá gorduroso", bg="#22223b", fg="#ffffff", activebackground="#4a4e69", command=lambda: self.acao("sofa"), **btn_opts).pack(pady=6)
        tk.Button(self.root, text="📦 Abrir caixa de pizza de há 3 semanas", bg="#22223b", fg="#ffffff", activebackground="#4a4e69", command=lambda: self.acao("pizza"), **btn_opts).pack(pady=6)
        tk.Button(self.root, text="🚪 Tentar arrombar a porta de saída", bg="#9a031e", fg="#ffffff", activebackground="#fb8500", command=self.tentar_fuga, **btn_opts).pack(pady=15)

    def clear_frame(self):
        for widget in self.root.winfo_children():
            widget.destroy()

    def acao(self, local):
        trolls = [
            "Apanhaste uma croquete estragada! O cheiro atraiu o Cara das Resenhas!",
            "Era um alarme falso que começou a tocar o tema do Shrek aos berros!",
            "Achaste um espelho e assustaste-te com a tua própria cara de pânico!",
            "Pisaste numa banana e escorregaste diretamente para o chão!",
            "Encontraste um gravador que gritou: 'RECEBA! O MELHOR DO MUNDO!'",
        ]
        
        resultado = random.choice(["chave", "troll", "nada", "troll"])
        
        if resultado == "chave" and self.chaves_encontradas < 3:
            self.chaves_encontradas += 1
            messagebox.showinfo("BOA!", f"🔑 Encontraste uma chave lendária! ({self.chaves_encontradas}/3)")
        elif resultado == "troll":
            msg = random.choice(trolls)
            self.sanidade = max(0, self.sanidade - 15)
            messagebox.showwarning("🔥 TROLLADO!", f"{msg}
A tua sanidade baixou para {self.sanidade}%!")
            self.povoar_jumpscare_chance()
        else:
            messagebox.showinfo("Vazio", "Não há nada aqui a não ser poeira e memes velhos de 2016.")
            
        self.setup_ui()

    def povoar_jumpscare_chance(self):
        if random.random() < 0.5:
            self.jumpscare()

    def jumpscare(self):
        self.tentativas += 1
        
        js = tk.Toplevel(self.root)
        js.geometry("700x500")
        js.configure(bg="#ff0033")
        js.title("🚨 JUMPSCARE TROLL 🚨")
        
        lbl = tk.Label(
            js, 
            text="🤡💥

'OLÁ MEU NOBRE!
SENTA AQUI QUE HORA DA RESENHA!'", 
            font=("Impact", 28, "bold"), 
            fg="#ffff00", 
            bg="#ff0033"
        )
        lbl.pack(expand=True)
        
        try:
            self.root.bell()
        except:
            pass
            
        if self.tentativas >= self.max_tentativas:
            messagebox.showerror("☠️ GAME OVER ☠️", "Foste apanhado 5 vezes!
Agora vais ter de virar editor de vídeos dele para o resto da tua vida!")
            sys.exit()
        else:
            js.after(1800, js.destroy)
            self.setup_ui()

    def tentar_fuga(self):
        if self.chaves_encontradas >= 3:
            messagebox.showinfo("CONSEGUISTE?!", "Abriste as 3 trancas da porta principal...")
            messagebox.showwarning("🤡 TROLLADO NO FINAL!", "A porta dava para a sala de estar dele!
O Cara das Resenhas está a fazer um live no TikTok e obriga-te a dançar ao lado dele!")
            sys.exit()
        else:
            messagebox.showerror("🔒 TRANCADO!", f"A porta tem 3 alfinetes de segurança! Só achaste {self.chaves_encontradas}/3 chaves!")

if __name__ == "__main__":
    root = tk.Tk()
    app = CaraDasResenhasApp(root)
    root.mainloop()

