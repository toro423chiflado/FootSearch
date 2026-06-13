# Usuarios de prueba (tras `npm run seed` o primer arranque en Docker)

Todos tienen la misma contraseña: **demo1234**

## Clubes (editables — inician sesión y ven "Mi club")
| Correo                         | Club                   | Ciudad  |
|--------------------------------|------------------------|---------|
| atletico.condores@demo.pe      | Atlético Cóndores FC   | Huaraz  |
| deportivo.manglar@demo.pe      | Deportivo Manglar      | Tumbes  |

## Jugadores (editables — inician sesión y ven "Mi perfil")
| Correo            | Nombre                  | Club asignado          |
|-------------------|-------------------------|------------------------|
| diego@demo.pe     | Diego Quispe Mamani     | Atlético Cóndores FC   |
| luis@demo.pe      | Luis Mendoza Vargas     | (agente libre)         |
| andres@demo.pe    | Andrés Huamán Soto      | Deportivo Manglar      |
| joaquin@demo.pe   | Joaquín Vega Castro     | (agente libre)         |

## Cazatalentos
| Correo          | Nombre     |
|-----------------|------------|
| scout@demo.pe   | Ana Scout  |

## Notas
- Los clubes son ficticios y poco conocidos a propósito.
- Cada usuario puede editar sus datos (incluida la descripción) con el icono de
  lápiz que aparece junto a cada campo en su perfil.
- Las estadísticas (goles, asistencias, etc.) siguen en 0 y solo las cambia el
  endpoint de administración (ver ADMIN.md).
- Hay ~998 códigos de club libres adicionales para registrar clubes nuevos.
