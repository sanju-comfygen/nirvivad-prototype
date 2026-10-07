#!/usr/bin/env python3
"""Render a captioned visual deck and PDF from live prototype screenshots."""
import json,sys,math
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageFilter

deck=json.loads(Path(sys.argv[1]).read_text())
slides_dir=Path(sys.argv[2]);out=Path(sys.argv[3]);slides_dir.mkdir(parents=True,exist_ok=True)
video_dir=out/'video-frames';video_dir.mkdir(parents=True,exist_ok=True)
W,H=1600,900
navy='#102d52';blue='#16477f';teal='#0f8e88';ink='#19344f';muted='#536b81';white='#ffffff';pale='#e9f2fa'
font_file='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';bold_file='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(size,bold=False):return ImageFont.truetype(bold_file if bold else font_file,size)
def rounded(draw,xy,r,fill,outline=None,width=1):draw.rounded_rectangle(xy,radius=r,fill=fill,outline=outline,width=width)
def text_wrap(draw,message,f,maxwidth):
 words=message.split();lines=[];line=''
 for word in words:
  candidate=(line+' '+word).strip()
  if draw.textlength(candidate,font=f)>maxwidth and line:lines.append(line);line=word
  else:line=candidate
 if line:lines.append(line)
 return lines

def base():
 im=Image.new('RGB',(W,H),'#f3f7fb');d=ImageDraw.Draw(im)
 d.rectangle((0,0,W,9),fill=teal)
 return im,d

def cover():
 im=Image.new('RGB',(W,H),navy);d=ImageDraw.Draw(im)
 d.polygon([(0,H),(W*0.55,0),(W,0),(W,H)],fill='#174879')
 for i in range(8):d.arc((W-680+i*35,-170+i*25,W+150+i*35,650+i*25),185,330,fill='#2b648b',width=2)
 rounded(d,(95,92,470,147),20,teal)
 d.text((120,106),'NIRVIVAD  •  TEAM WALKTHROUGH',font=font(22,True),fill=white)
 d.text((95,235),'Prototype flows',font=font(78,True),fill=white)
 d.text((95,343),'Updated 7 October 2026',font=font(38),fill='#cfe2f2')
 d.text((95,445),'Property • Buyer enquiry • Professional reviews',font=font(30),fill=white)
 d.text((95,500),'Selective report sharing • Follow-up rounds',font=font(30),fill=white)
 rounded(d,(95,665,1505,791),28,'#1c557d')
 d.text((130,695),'Live browser prototype  /  sample accounts and documents',font=font(27),fill='#d7eaf5')
 d.text((95,845),'CLIENT REVIEW EDITION',font=font(20,True),fill='#90c5d3')
 return im

cover_im=cover();cover_im.save(slides_dir/'slide-00.png',optimize=True);cover_im.save(out/'Nirvivad_Full_Walkthrough_Cover_2026-10-07.png',optimize=True)
def video_frame(screen,title,note,index):
 frame=Image.new('RGB',(1600,1000),navy)
 screen=screen.convert('RGB')
 if screen.size!=(1600,900):screen=screen.resize((1600,900),Image.Resampling.LANCZOS)
 frame.paste(screen,(0,0))
 d=ImageDraw.Draw(frame)
 d.rectangle((0,900,1600,1000),fill=navy)
 d.text((32,913),title,font=font(27,True),fill=white)
 d.text((32,955),' '.join(text_wrap(d,note,font(18),1410)[:1]),font=font(18),fill='#dceaf4')
 d.text((1567,927),f'{index:02d} / {len(deck):02d}',font=font(19,True),fill='#8cc8d2',anchor='ra')
 frame.save(video_dir/f'slide-{index:02d}.png',optimize=True)

video_frame(cover_im,'Nirvivad prototype walkthrough','Updated 7 October 2026 · Sample data and accounts',0)
images=[cover_im]
for index,item in enumerate(deck,1):
 im,d=base();d.text((74,34),'NIRVIVAD / PROTOTYPE WALKTHROUGH',font=font(22,True),fill=teal)
 title=item['title'];d.text((74,82),title,font=font(44,True),fill=navy)
 src=Image.open(item['screenshot']).convert('RGB');maxw,maxh=1452,650;scale=min(maxw/src.width,maxh/src.height);size=(round(src.width*scale),round(src.height*scale));src=src.resize(size,Image.Resampling.LANCZOS)
 x=(W-size[0])//2;y=154+(650-size[1])//2
 shadow=Image.new('RGBA',(size[0]+28,size[1]+28),(0,0,0,0));sd=ImageDraw.Draw(shadow);sd.rounded_rectangle((12,12,size[0]+16,size[1]+16),radius=16,fill=(22,47,77,45));shadow=shadow.filter(ImageFilter.GaussianBlur(10));im.paste(shadow,(x-14,y-14),shadow)
 d=ImageDraw.Draw(im);rounded(d,(x-3,y-3,x+size[0]+3,y+size[1]+3),13,white,'#c9d9e8',3);im.paste(src,(x,y));d=ImageDraw.Draw(im)
 rounded(d,(52,810,1548,878),17,navy)
 lines=text_wrap(d,item['note'],font(23),1430)
 d.text((78,827),' '.join(lines[:2]),font=font(23),fill=white)
 d.text((1510,48),f'{index:02d} / {len(deck):02d}',font=font(22,True),fill=muted,anchor='ra')
 im.save(slides_dir/f'slide-{index:02d}.png',optimize=True);images.append(im)
 video_frame(Image.open(item['screenshot']),'Nirvivad / '+title,item['note'],index)
final,d=base();d.rectangle((0,0,W,H),fill=navy);d.text((86,102),'CLIENT REVIEW / NEXT DECISIONS',font=font(25,True),fill='#7fc6cb');d.text((86,190),'What to confirm with the client',font=font(55,True),fill=white)
items=[('Role-specific requirements','Final credentials, documents and report sections for Broker, Partner, Arbitrator and Builder.'),('Sharing permissions','Which professional findings and attachments may be shared with each assigned role.'),('Follow-up policy','When a submitted review requires a new round, due date, and approval before closing.'),('Production controls','Server authorization, durable audit, real KYC, document storage and notifications.')]
y=318
for n,(heading,body) in enumerate(items,1):
 rounded(d,(86,y,1514,y+108),16,'#1b4c73');d.text((108,y+20),f'{n:02d}',font=font(29,True),fill='#91d0d5');d.text((172,y+14),heading,font=font(27,True),fill=white);d.text((172,y+54),body,font=font(20),fill='#dceaf4');y+=124
final.save(slides_dir/f'slide-{len(deck)+1:02d}.png',optimize=True);images.append(final)
video_frame(final,'Client review / next decisions','Confirm requirements, sharing permissions, follow-up policy and production controls.',len(deck)+1)
pdf=out/'Nirvivad_Prototype_Flow_Guide_2026-10-07.pdf';images[0].save(pdf,'PDF',save_all=True,append_images=images[1:],resolution=120.0)
notes=['# Nirvivad prototype walkthrough — 7 October 2026','','This client-review edition uses live screenshots from an isolated browser profile with sample records. It updates the 6 October walkthrough while keeping the earlier edition for reference.','','## Slide notes','']
for i,item in enumerate(deck,1):notes.append(f'{i:02d}. **{item["title"]}** — {item["note"]}')
notes+=['','## Client decisions to confirm','','- Final role credentials, required documents and report fields.','- Role-by-role permissions for shared report sections and attachments.','- Follow-up review policy, due dates, and closing rules.','- Production authentication, durable audit, document storage, KYC and notification integrations.','']
(out/'Nirvivad_Walkthrough_Notes_2026-10-07.md').write_text('\n'.join(notes))
print(f'Rendered {len(images)} slides and {pdf.name}')
