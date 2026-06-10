import turtle
import colorsys

# Window configuration
screen = turtle.Screen()
screen.setup(900, 900)
screen.bgcolor('black')
screen.title("Advanced 3D Geometric Vortex")

# Turtle configuration
t = turtle.Turtle()
t.speed(0)
t.hideturtle()
turtle.tracer(25) # Massive speed boost: updates screen every 25 actions

hue = 0.0

# The advanced morphing loop
for i in range(450):
    # Smoothly shift colors across the entire spectrum
    color = colorsys.hsv_to_rgb(hue, 1.0, 1.0)
    t.pencolor(color)
    hue += 0.002
    
    # Dynamic line thickness creates a sense of 3D depth/perspective
    t.pensize(i // 100 + 1)
    
    # Complex geometric combination
    t.forward(i)     # Move forward (increases every loop to expand outward)
    t.left(200)      # Sharp angle creates the inner star lattice
    t.circle(i, 60)  # Introduces expanding curves into the design
    t.left(95)       # The slight offset that forces the entire shape to spiral

turtle.done()