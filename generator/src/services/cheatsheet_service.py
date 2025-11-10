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

    def check_switch_column(self, extra_height=0):
        """Check if we need to switch column"""
        if self.y_pos + extra_height > self.h - self.margin:
            return True

    def switch_column_if_needed(self, extra_height=0):
        """Switch column or add page if overflow"""
        if self.check_switch_column(extra_height):
            if self.column == "left":
                self.column = "right"
                self.y_pos = self.margin
            else:
                self.add_page()
                self.column = "left"
                self.y_pos = self.margin

    def add_line(self, text, size=2):
        # Set font style
        if size == 0:
            self.set_font("Arial", "B", 15)
            self.set_text_color(255, 0, 0)
        elif size == 1:
            self.set_font("Arial", "B", 12)
            self.set_text_color(255, 255, 255)
        else:
            self.set_font("Arial", "", 9)
            self.set_text_color(0, 0, 0)

        self.switch_column_if_needed(self.line_height)

        x_pos = (
            self.margin
            if self.column == "left"
            else self.margin * 3 / 2 + self.col_width
        )
        self.set_xy(x_pos, self.y_pos)
        self.multi_cell(
            self.col_width - self.margin / 2,
            self.line_height,
            text,
            border=0,
            align="L",
        )
        self.y_pos = self.get_y()

    def add_spacing(self, lines=1):
        self.y_pos += self.line_height * lines
        self.switch_column_if_needed()

    # 🟧 Draw chapter block with orange title
    def add_chapter_box(self, title, body_lines):
        x_pos = (
            self.margin
            if self.column == "left"
            else self.margin * 3 / 2 + self.col_width
        )
        y_start = self.y_pos

        # 📝 Title text to get the height
        self.add_line(title, 1)
        y_end = self.y_pos

        # 🟧 Fill title background
        self.set_fill_color(255, 165, 0)
        self.rect(
            x_pos, y_start, self.col_width - self.margin / 2, y_end - y_start, style="F"
        )

        # 📝 Title text again
        self.y_pos = y_start
        self.add_line(title, 1)
        y_end = self.y_pos

        # 🧾 Body text
        for text in body_lines:
            x_pos = (
                self.margin
                if self.column == "left"
                else self.margin * 3 / 2 + self.col_width
            )
            # ⚙️ When the text wraps to a new column:
            if self.check_switch_column(self.line_height):
                # Draw box for previous column block
                self.set_draw_color(0, 0, 0)
                self.set_line_width(0.3)
                self.rect(
                    x_pos, y_start, self.col_width - self.margin / 2, y_end - y_start
                )

                # Reset starting coordinates for the new column
                y_start = self.margin

            self.add_line(text, 2)
            y_end = self.y_pos
            x_pos = (
                self.margin
                if self.column == "left"
                else self.margin * 3 / 2 + self.col_width
            )
            self.set_draw_color(0, 0, 0)
            self.set_line_width(0.1)
            self.line(x_pos, y_end, x_pos + self.col_width - self.margin / 2, y_end)

        # 🟦 Draw box
        self.set_draw_color(0, 0, 0)
        self.set_line_width(0.3)
        self.rect(x_pos, y_start, self.col_width - self.margin / 2, y_end - y_start)


def write_in_pdf(parsed_data):
    pdf = TwoColumnPDF()
    for summary in parsed_data:
        pdf.add_line(summary["header"], size=0)
        pdf.add_spacing(0.5)

        for chapter in summary["chapters"]:
            pdf.add_chapter_box(chapter["title"], chapter["body"])
            pdf.add_spacing(0.5)

    pdf_byte_string = pdf.output(dest="S").encode("latin-1")
    return pdf_byte_string


def generate_cheatsheet(pdf_files):
    summary = generate_summary(pdf_files)
    pdf_bytes = write_in_pdf(summary)
    return pdf_bytes
