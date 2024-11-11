import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons"
import * as React from "react"
import { Button } from "./ui/button"

const animationClassName = cn("transition-all ease-in-out");

export const CopyButton = ({ content, children, className, copyButtonVariant }: { content?: string; children?: React.ReactNode; className?: string; copyButtonVariant?: Parameters<typeof Button>[0]["variant"] }) => {
    const [justCopied, setJustCopied] = React.useState(false);
    const [copyAnimation, setCopyAnimation] = React.useState(false);
    const copyAnimationTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

    const copy = () => {
        if (content) {
            setJustCopied(true);
            navigator.clipboard.writeText(content);
            toast("Copied value:", {
                description: content,
            })
        }
    }

    React.useEffect(() => {
        if (justCopied) {
            setJustCopied(false);
            setCopyAnimation(true);
            clearTimeout(copyAnimationTimerRef.current);
            copyAnimationTimerRef.current = setTimeout(() => setCopyAnimation(false), 1000);
        }
    }, [justCopied, setJustCopied, setCopyAnimation])

    return <div className={cn("w-fit h-fit", className, "relative")}>
<Button className={cn(animationClassName, "absolute w-full h-full", {
        "duration-150": copyAnimation,
        "opacity-0 duration-500": !copyAnimation
    })} onClick={copy} variant="success"><CheckIcon /></Button>
    <Button
className={
    cn(animationClassName, "w-full h-full", {
        "opacity-[1%] duration-150": copyAnimation,
        "duration-500": !copyAnimation,
    })
    } onClick={copy}
    variant={copyButtonVariant}
    >{children ?? <CopyIcon />}</Button>
    </div>
}
