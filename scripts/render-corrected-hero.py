from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE_VIDEO = Path.home() / "Videos/PREPS/Kie/seedance25_preps_720p.mp4"
OPENING_PLATE = Path.home() / "AppData/Roaming/Hermes/composer-images/composer_2026-09-07_00-05-50-952_0bd46a.png"
OUT_DIR = ROOT / "public/videos"
WORK_DIR = Path.home() / "Videos/PREPS/Kie/hero-correction"
MP4 = OUT_DIR / "hero-preps-seedance25-v2.mp4"
WEBM = OUT_DIR / "hero-preps-seedance25-v2.webm"
DURATION = "8.04"


def run(command: list[str]) -> None:
    print("Running:", " ".join(command))
    subprocess.run(command, check=True)


def make_mask(path: Path, polygon: list[tuple[int, int]], blur: int) -> None:
    mask = Image.new("L", (1280, 720), 0)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    if blur:
        mask = mask.filter(ImageFilter.GaussianBlur(blur))
    mask.save(path)


def main() -> None:
    for required in (SOURCE_VIDEO, OPENING_PLATE):
        if not required.exists():
            raise FileNotFoundError(required)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    interior = WORK_DIR / "interior-mask.png"
    corridor = WORK_DIR / "falling-rice-mask.png"

    # Only the rice section is corrected. The authentic opening plate supplies
    # the entire tray and studio set while Seedance remains visible in the cavity.
    make_mask(
        interior,
        [(565, 300), (795, 168), (910, 168), (1215, 310),
         (1235, 395), (1035, 532), (800, 503), (550, 365)],
        blur=5,
    )
    # Reveal the bright rice while it is above the tray without exposing the
    # generated plastic around it.
    make_mask(
        corridor,
        [(650, 0), (1090, 0), (1090, 220), (980, 260),
         (755, 260), (650, 220)],
        blur=4,
    )

    filter_graph = (
        "[0:v]scale=1280:720:in_range=pc:out_range=tv,"
        "format=yuv420p,setpts=PTS-STARTPTS[open];"
        "[1:v]setpts=PTS-STARTPTS,split=2[vsrc][vluma];"
        "[vluma]format=gray,lut=y='if(gt(val,48),255,0)'[lumakey];"
        "[2:v]scale=1280:720,format=gray,setpts=PTS-STARTPTS[inner];"
        "[3:v]scale=1280:720,format=gray,setpts=PTS-STARTPTS[corridor];"
        "[corridor][lumakey]blend=all_mode=multiply[corrkey];"
        "[inner][corrkey]blend=all_mode=screen[spatial];"
        "[spatial]geq=lum='if(lt(T,1.45),p(X,Y),if(lt(T,1.75),"
        "p(X,Y)+(255-p(X,Y))*(T-1.45)/0.30,255))'[mask];"
        "[open][vsrc][mask]maskedmerge,format=yuv420p[out]"
    )

    run([
        "ffmpeg", "-y",
        "-loop", "1", "-framerate", "24", "-i", str(OPENING_PLATE),
        "-i", str(SOURCE_VIDEO),
        "-loop", "1", "-framerate", "24", "-i", str(interior),
        "-loop", "1", "-framerate", "24", "-i", str(corridor),
        "-filter_complex", filter_graph,
        "-map", "[out]", "-t", DURATION, "-r", "24", "-an",
        "-c:v", "libx264", "-preset", "veryslow", "-crf", "10",
        "-tune", "film", "-color_primaries", "bt709",
        "-color_trc", "bt709", "-colorspace", "bt709",
        "-movflags", "+faststart", str(MP4),
    ])

    run([
        "ffmpeg", "-y", "-i", str(MP4), "-an", "-r", "24",
        "-c:v", "libvpx-vp9", "-crf", "18", "-b:v", "0",
        "-row-mt", "1", "-tile-columns", "2", "-frame-parallel", "1",
        "-deadline", "good", "-cpu-used", "1",
        "-color_primaries", "bt709", "-color_trc", "bt709",
        "-colorspace", "bt709", str(WEBM),
    ])

    print(f"Created {MP4}")
    print(f"Created {WEBM}")


if __name__ == "__main__":
    main()
