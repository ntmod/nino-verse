#!/usr/bin/env python3
"""Remove a solid edge-connected GIF background; export transparent animated WebP.

Requires Pillow: python3 -m pip install Pillow
Example: python3 scripts/remove-gif-background.py input.gif output.webp
"""
import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageColor, ImageDraw, ImageSequence


def remove_background(frame, background, tolerance):
    frame = frame.convert("RGBA")
    difference = ImageChops.difference(frame.convert("RGB"), Image.new("RGB", frame.size, background))
    red, green, blue = difference.split()
    distance = ImageChops.lighter(ImageChops.lighter(red, green), blue)
    mask = distance.point(lambda value: 255 if value <= tolerance else 0)
    transparent = frame.getchannel("A").point(lambda value: 255 if value == 0 else 0)
    mask = ImageChops.lighter(mask, transparent)
    width, height = frame.size
    edges = [(x, y) for x in range(width) for y in (0, height - 1)]
    edges += [(x, y) for y in range(height) for x in (0, width - 1)]
    for point in edges:
        if mask.getpixel(point) == 255:
            ImageDraw.floodfill(mask, point, 128)
    # Only remove candidate pixels connected to the edges, preserving enclosed whites.
    alpha = mask.point(lambda value: 0 if value == 128 else 255)
    frame.putalpha(ImageChops.multiply(frame.getchannel("A"), alpha))
    return frame


def convert(source, output, background, tolerance):
    if output.exists():
        raise ValueError(f"Output already exists: {output}")
    if output.suffix.lower() != ".webp":
        raise ValueError("Output must end in .webp")
    with Image.open(source) as animation:
        if animation.format != "GIF":
            raise ValueError("Input must be a GIF")
        loop = animation.info.get("loop")
        frames, durations = [], []
        # Pillow composites GIF disposal frames before conversion to RGBA.
        for frame in ImageSequence.Iterator(animation):
            durations.append(frame.info.get("duration", 100))
            frames.append(remove_background(frame, background, tolerance))
        options = {"loop": loop} if loop is not None else {"loop": 1}
        frames[0].save(output, format="WEBP", save_all=True, append_images=frames[1:],
                       duration=durations, lossless=True, exact=True, **options)
    print(f"Saved {output} ({len(frames)} source frames, {sum(durations)} ms)")


def self_test():
    frame = Image.new("RGBA", (7, 7), "white")
    ImageDraw.Draw(frame).rectangle((1, 1, 5, 5), fill="black")
    frame.putpixel((3, 3), (255, 255, 255, 255))
    cleaned = remove_background(frame, (255, 255, 255), 24)
    assert cleaned.getpixel((0, 0))[3] == 0
    assert cleaned.getpixel((1, 1))[3] == 255
    assert cleaned.getpixel((3, 3))[3] == 255
    assert frame.getpixel((0, 0))[3] == 255
    print("Verified: background removed, subject and enclosed whites preserved.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, nargs="?")
    parser.add_argument("output", type=Path, nargs="?")
    parser.add_argument("--background", default="#ffffff", help="Solid background color (default: white)")
    parser.add_argument("--tolerance", type=int, default=24, help="Color tolerance from 0 to 255")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
    else:
        if not args.source or not args.output:
            parser.error("source and output are required")
        if not 0 <= args.tolerance <= 255:
            parser.error("tolerance must be between 0 and 255")
        try:
            convert(args.source, args.output, ImageColor.getrgb(args.background), args.tolerance)
        except (OSError, ValueError) as error:
            parser.exit(1, f"Error: {error}\n")
