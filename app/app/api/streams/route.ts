import { prismaClient } from "@/app/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import youtubesearchapi from "youtube-search-api";

const YT_REGEX = /^(?:(?:https?:)?\/\/)?(?:www\.)?(?:m\.)?(?:youtu(?:be)?\.com\/(?:v\/|embed\/|watch(?:\/|\?v=))|youtu\.be\/)((?:\w|-){11})(?:\S+)?$/;

const CreateStreamSchema = z.object({
    creatorId: z.string(),
    url: z.string().refine(
        (val) => val.includes("spotify") || val.includes("youtube"),
        "Url should be of spotify or youtube "
    )
})


export async function POST(req: NextRequest) {
    try {

        const data = CreateStreamSchema.parse(await req.json());
        const isYt = data.url.match(YT_REGEX)
     
        if (!isYt) {
            return NextResponse.json({
            message: "Wrong url format"
        }, {
            status:411
            })
            
        }
        const extractedId = data.url.split("?v=")[1];

        const res = await youtubesearchapi.GetVideoDetails(extractedId);
        console.log(res.title)
        const thumbnails =res.thumbnail.thumbnails
        thumbnails.sort((a :{width:number},b:{width:number})=> a.width < b.width ? -1: 1)

  const stream =  await  prismaClient.stream.create({
      data: {
          userId: data.creatorId,
          url: data.url,
          extractedId,
          type: "Youtube",
          title: res.title ?? "Can't Find Video ",
          smallImg: thumbnails.length >1 ? thumbnails[thumbnails.length - 2].url : thumbnails[thumbnails.length - 1].url ?? "https://images.app.goo.gl/r9Qo6pnSwoovgbJg9",
          bigImg: thumbnails[thumbnails.length - 1].url ?? "https://images.app.goo.gl/r9Qo6pnSwoovgbJg9",
          
            }

     })
        return NextResponse.json({
            message: "Added stream",
            id: stream.id
        })

    } catch (e) {
        console.error("stream err ",e)
        return NextResponse.json({
            message: "Error while adding a stream"
        }, {
            status:411
        })
    }
}


export async function GET(req:NextRequest) {
    const creatorId = req.nextUrl.searchParams.get("creatorId");
    const streams = await prismaClient.stream.findMany({
        where: {
            userId: creatorId ?? ""
        }
    })

    return NextResponse.json({
        streams
    })
}


