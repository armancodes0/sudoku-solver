import os
import streamlit as st
import streamlit.components.v1 as components

# Configure Streamlit page layout
st.set_page_config(
    page_title="Sudoku Solver - Digital Logic Concepts",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS to make the app fill the full screen and remove default Streamlit margins
st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .block-container {
            padding: 0 !important;
            max-width: 100% !important;
        }
        iframe {
            width: 100% !important;
            border: none !important;
        }
    </style>
""", unsafe_allow_html=True)

def get_bundled_html():
    """
    Reads index.html and inlines style.css and script.js so the
    entire web app renders seamlessly inside the Streamlit component iframe.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    index_path = os.path.join(base_dir, "index.html")
    css_path = os.path.join(base_dir, "style.css")
    js_path = os.path.join(base_dir, "script.js")
    
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()
        
    with open(css_path, "r", encoding="utf-8") as f:
        css = f.read()
        
    with open(js_path, "r", encoding="utf-8") as f:
        js = f.read()
        
    # Replace external links with inlined styles and scripts
    html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
    html = html.replace('<script src="script.js"></script>', f'<script>\n{js}\n</script>')
    
    return html

# Render the application
app_html = get_bundled_html()
components.html(app_html, height=1800, scrolling=True)
