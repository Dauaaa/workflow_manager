import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useWorkflowStore } from "@/store/context";
import { InfoIcon, MenuIcon, ShareIcon, UserIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import * as React from "react";
import { QRCodeSVG } from "qrcode.react";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const sessionLink = (clientId: string) =>
  `https://workflow-manager-client.fly.dev/workflows?clientId=${clientId}`;

export const AuthenticationDisplay = observer(() => {
  const workflowStore = useWorkflowStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const auth = workflowStore.authentication.current;

  React.useEffect(() => {
    if (!auth && pathname !== "/workflows") navigate("/workflows");
  }, [auth, navigate, pathname]);

  return (
    <>
      <DesktopMenu />
      <MobileAuthMenu />
    </>
  );
});

const DesktopMenu = observer(() => {
  const workflowStore = useWorkflowStore();

  const auth = workflowStore.authentication.current;

  const [isOpen, setIsOpen] = React.useState({
    open: false,
    justClickedChildren: false,
  });

  const handleUserButtonClick = () =>
    setIsOpen((x) => ({
      open: !x.open,
      justClickedChildren: false,
    }));

  const handleUserButtonBlur = () =>
    setIsOpen((x) => ({
      open: x.justClickedChildren,
      justClickedChildren: false,
    }));

  const handleChildOnMouseDown = () =>
    setIsOpen((x) => ({
      open: x.open,
      justClickedChildren: true,
    }));

  const handleChildOnClick = () =>
    setIsOpen(() => ({
      open: false,
      justClickedChildren: false,
    }));

  return (
    <div
      className="
    hidden
    md:flex
    justify-start w-[100vw] fixed bottom-0 pb-4 px-12 text-secondary-foreground text-sm
    "
    >
      <Dialog>
        <Button
          onClick={handleUserButtonClick}
          onBlur={handleUserButtonBlur}
          className="relative w-16"
        >
          <UserIcon />
          <DialogTrigger asChild>
            <Button
              onMouseDown={handleChildOnMouseDown}
              onClick={handleChildOnClick}
              className={cn("transition-all duration-200 absolute", {
                "translate-x-[6.5rem]": isOpen.open,
                "scale-0": !isOpen.open,
              })}
            >
              Share session
            </Button>
          </DialogTrigger>
          <Button
            className={cn("transition-all duration-200 w-16 absolute", {
              "translate-y-[-3.5rem]": isOpen.open,
              "scale-0": !isOpen.open,
            })}
            onMouseDown={handleChildOnMouseDown}
            onClick={() => {
              handleChildOnClick();
              workflowStore.setAuthentication();
            }}
          >
            Logout
          </Button>
        </Button>
        <DialogContent className="max-w-[34rem]">
          <DialogTitle>Share your session with friends!</DialogTitle>
          <DialogDescription>
            All sessions are isolated, share this ID if you want someone to see
            your workflows.
          </DialogDescription>
          <div className="flex flex-col gap-2">
            {auth?.clientId ? (
              <>
                <div className="flex">
                  <Label htmlFor="sessionIdDesktop" className="my-auto w-20">
                    Session ID:
                  </Label>
                  <span
                    id="sessionIdDesktop"
                    className="font-mono font-bold w-96 my-auto"
                  >
                    {auth?.clientId}
                  </span>
                </div>
                <div className="flex grow gap-2">
                  <CopyButton
                    copyButtonVariant="outline"
                    className="w-full"
                    content={auth.clientId}
                  >
                    Copy session ID
                  </CopyButton>
                  <CopyButton
                    copyButtonVariant="outline"
                    className="w-full"
                    content={sessionLink(auth.clientId)}
                  >
                    Copy session link
                  </CopyButton>
                </div>
                <Alert className="mt-12">
                  <InfoIcon className="h-4 w-4" />
                  <AlertTitle className="font-bold">QR code login</AlertTitle>
                  <AlertDescription>
                    You can login to this session by just scanning the QR code
                  </AlertDescription>
                </Alert>
                <div id="sessionIdQrCodeDesktop" className="w-fit mx-auto">
                  <QRCodeSVG value={sessionLink(auth.clientId)} size={300} />
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

const MobileAuthMenu = () => {
  const workflowStore = useWorkflowStore();

  const auth = workflowStore.authentication.current;

  if (!auth) return null;

  const shareObject = {
    title: "Share session",
    text: "Access my workflow manager session.\n",
    url: sessionLink(auth.clientId),
  };

  return (
    <div
      className="
fixed
md:hidden
top-8 left-8
"
    >
      <Sheet>
        <SheetTrigger asChild>
          <Button>
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="flex flex-col justify-between h-full px-4">
            <div className="flex flex-col gap-3">
              {auth?.clientId ? (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full">Session QRCode</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogTitle>Session QR code</DialogTitle>
                      <DialogDescription>
                        Scan this QR code to access your session
                      </DialogDescription>
                      <div className="w-fit mx-auto">
                        <QRCodeSVG
                          value={sessionLink(auth.clientId)}
                          size={200}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  {navigator.canShare?.(shareObject) ? (
                    <Button
                      onClick={() => void navigator.share(shareObject)}
                      className="w-full"
                    >
                      <ShareIcon /> Share sessions
                    </Button>
                  ) : (
                    <CopyButton
                      content={sessionLink(auth.clientId)}
                      className="w-full"
                    >
                      Copy session link
                    </CopyButton>
                  )}
                </>
              ) : null}
            </div>
            <Button
              onClick={() => workflowStore.setAuthentication()}
              className="w-fit"
            >
              Logout
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
