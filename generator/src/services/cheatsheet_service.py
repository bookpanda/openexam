import json
import os

from dotenv import load_dotenv
from fpdf import FPDF
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()
gemini_api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=gemini_api_key)


class Chapter(BaseModel):
    title: str
    body: list[str]


class Summary(BaseModel):
    header: str
    chapters: list[Chapter]


def generate_summary(pdf_files):
    contents = [
        types.Part.from_bytes(
            data=file,
            mime_type="application/pdf",
        )
        for file in pdf_files
    ]
    prompt = "You are given multiple documents to summarize for exam preparation. \
                For each document, produce a concise summary that fits within two A4 pages, with each page split into two equal-width columns. \
                Include only the most important concepts, facts, definitions, processes, or arguments likely to be tested. \
                Omit introductions, filler, background, or overly detailed explanations. \
                Each section should have a title that reflects the topic, and a body that is a list of short, clear paragraphs capturing the key points of that topic. \
                Each summary must include a header, which should be the title of the corresponding PDF document."
    contents += [prompt]

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=contents,
        config={
            "response_mime_type": "application/json",
            "response_schema": list[Summary],
        },
    )
    # Example: get the JSON string from the response
    json_str = response.text  # or wherever the string is

    # Parse string to Python list[dict]
    parsed_data = json.loads(json_str)

    return parsed_data


class TwoColumnPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=False)
        self.add_page()

        # Layout constants
        self.margin = 10
        self.line_height = 6
        self.page_height = self.h - 2 * self.margin
        self.col_width = (self.w - 2 * self.margin) / 2

        self.column = "left"
        self.y_pos = self.margin

    def add_line(self, text, size=2):
        # Change font for title
        if size == 0:
            self.set_font("Arial", "B", 15)
            self.set_text_color(256, 0, 0)
        elif size == 1:
            self.set_font("Arial", "B", 12)
            self.set_text_color(0, 0, 0)
        else:
            self.set_font("Arial", "", 9)
            self.set_text_color(0, 0, 0)

        # Handle column switching
        if self.y_pos + self.line_height > self.h - self.margin:
            if self.column == "left":
                self.column = "right"
                self.y_pos = self.margin
            else:
                self.add_page()
                self.column = "left"
                self.y_pos = self.margin

        # Set X based on column
        x_pos = self.margin if self.column == "left" else self.margin + self.col_width
        self.set_xy(x_pos, self.y_pos)

        # Draw the text
        self.multi_cell(self.col_width, self.line_height, text, border=0, align="L")
        self.y_pos = self.get_y()

    def add_spacing(self, lines=1):
        self.y_pos += self.line_height * lines
        if self.y_pos > self.h - self.margin:
            if self.column == "left":
                self.column = "right"
                self.y_pos = self.margin
            else:
                self.add_page()
                self.column = "left"
                self.y_pos = self.margin


def write_in_pdf(parsed_data):
    pdf = TwoColumnPDF()
    for summary in parsed_data:
        pdf.add_line(summary["header"], size=0)
        pdf.add_spacing(0.5)

        for chapter in summary["chapters"]:
            # Add chapter title in larger bold font
            pdf.add_line(chapter["title"], size=1)
            pdf.add_spacing(0.5)

            # Add each paragraph
            for paragraph in chapter["body"]:
                pdf.add_line(paragraph.strip())

            # Extra spacing between chapters
            pdf.add_spacing(0.5)

    pdf_byte_string = pdf.output(dest="S").encode("latin-1")
    return pdf_byte_string


def generate_cheatsheet(pdf_files):
    summary = generate_summary(pdf_files)
    pdf_bytes = write_in_pdf(summary)
    return pdf_bytes
