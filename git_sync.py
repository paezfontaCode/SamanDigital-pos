#!/usr/bin/env python3
"""
Script de automatización Git para SamanDigital-pos
Uso: python git_sync.py [mensaje_opcional]
"""

import subprocess
import sys
import os
from pathlib import Path

class GitSync:
    def __init__(self):
        self.repo_path = Path(__file__).parent
        os.chdir(self.repo_path)
        
    def run_command(self, command, error_msg="Error al ejecutar comando"):
        """Ejecuta un comando de git y retorna el resultado"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                check=True
            )
            return True, result.stdout
        except subprocess.CalledProcessError as e:
            print(f"❌ {error_msg}")
            print(f"Error: {e.stderr}")
            return False, e.stderr
    
    def check_git_status(self):
        """Verifica si hay cambios pendientes"""
        print("🔍 Verificando estado del repositorio...")
        success, output = self.run_command("git status --porcelain")
        
        if not success:
            return False
        
        if not output.strip():
            print("✅ No hay cambios pendientes para sincronizar")
            return False
        
        print(f"📝 Cambios detectados:")
        for line in output.strip().split('\n')[:10]:  # Mostrar primeros 10 cambios
            print(f"   {line}")
        
        if len(output.strip().split('\n')) > 10:
            print(f"   ... y {len(output.strip().split('\n')) - 10} más")
        
        return True
    
    def check_gitignore(self):
        """Verifica que el .gitignore existe y está configurado"""
        print("\n🔍 Verificando .gitignore...")
        gitignore_path = self.repo_path / ".gitignore"
        
        if not gitignore_path.exists():
            print("⚠️  No se encontró .gitignore")
            return False
        
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        essential_ignores = ['node_modules', '.env', '__pycache__', '.next']
        missing = [item for item in essential_ignores if item not in content]
        
        if missing:
            print(f"⚠️  Faltan entradas importantes en .gitignore: {', '.join(missing)}")
            return False
        
        print("✅ .gitignore está configurado correctamente")
        return True
    
    def git_add(self):
        """Agrega todos los cambios"""
        print("\n📦 Agregando cambios...")
        success, output = self.run_command(
            "git add .",
            "Error al agregar archivos"
        )
        
        if success:
            print("✅ Archivos agregados correctamente")
        return success
    
    def git_commit(self, message):
        """Hace commit de los cambios"""
        print(f"\n💾 Haciendo commit: {message}")
        success, output = self.run_command(
            f'git commit -m "{message}"',
            "Error al hacer commit"
        )
        
        if success:
            print("✅ Commit realizado correctamente")
        return success
    
    def git_push(self):
        """Sube los cambios al repositorio remoto"""
        print("\n🚀 Subiendo cambios a GitHub...")
        
        # Detectar la rama actual
        success, branch = self.run_command(
            "git branch --show-current",
            "Error al detectar rama actual"
        )
        
        if not success:
            return False
        
        branch = branch.strip()
        print(f"📍 Rama actual: {branch}")
        
        success, output = self.run_command(
            f"git push origin {branch}",
            "Error al hacer push"
        )
        
        if success:
            print("✅ Cambios subidos correctamente a GitHub")
        return success
    
    def sync(self, message=None):
        """Ejecuta el proceso completo de sincronización"""
        print("=" * 60)
        print("🔄 Git Sync - SamanDigital-pos")
        print("=" * 60)
        
        # Verificar si hay cambios
        if not self.check_git_status():
            return False
        
        # Verificar .gitignore
        self.check_gitignore()
        
        # Agregar cambios
        if not self.git_add():
            return False
        
        # Hacer commit
        if message is None:
            from datetime import datetime
            message = f"Actualización automática - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        
        if not self.git_commit(message):
            return False
        
        # Hacer push
        if not self.git_push():
            return False
        
        print("\n" + "=" * 60)
        print("✅ Sincronización completada exitosamente")
        print("=" * 60)
        return True

def main():
    """Función principal"""
    # Obtener mensaje de commit de argumentos
    message = None
    if len(sys.argv) > 1:
        message = " ".join(sys.argv[1:])
    
    # Ejecutar sincronización
    syncer = GitSync()
    success = syncer.sync(message)
    
    # Retornar código de salida
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
