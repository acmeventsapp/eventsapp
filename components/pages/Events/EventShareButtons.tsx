"use client";

import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  XShareButton,
  WhatsappShareButton,
} from "react-share";
import { Mail, MessageCircle, Share2 } from "lucide-react";
import { FaFacebook,FaLinkedin } from "react-icons/fa";
import { cn } from "@/lib/utils";

interface EventShareButtonsProps {
  url: string;
  title: string;
  description: string;
}

function ShareIconButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border border-asm-terracotta/20 bg-card text-asm-terracotta transition-colors hover:border-asm-lime-green/40 hover:bg-asm-lime-green/15 hover:text-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

export default function EventShareButtons({
  url,
  title,
  description,
}: EventShareButtonsProps) {
  const shareSummary = description.slice(0, 120);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-asm-terracotta/15 bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium justify-center">
        <Share2 className="size-4 text-asm-terracotta" />
        Share this event
      </div>
      <div className="flex flex-wrap items-center gap-2 justify-center">
        <FacebookShareButton url={url} hashtag="#ACMEvents">
          <ShareIconButton>
            <FaFacebook className="size-4" />
          </ShareIconButton>
        </FacebookShareButton>

        <XShareButton url={url} title={title}>
          <ShareIconButton>
            <span className="text-xs font-bold">X</span>
          </ShareIconButton>
        </XShareButton>

        <WhatsappShareButton url={url} title={title} separator=" — ">
          <ShareIconButton>
            <MessageCircle className="size-4" />
          </ShareIconButton>
        </WhatsappShareButton>

        <LinkedinShareButton url={url} title={title} summary={shareSummary}>
          <ShareIconButton>
            <FaLinkedin className="size-4" />
          </ShareIconButton>
        </LinkedinShareButton>

        <EmailShareButton url={url} subject={title} body={shareSummary}>
          <ShareIconButton>
            <Mail className="size-4" />
          </ShareIconButton>
        </EmailShareButton>
      </div>
    </div>
  );
}
