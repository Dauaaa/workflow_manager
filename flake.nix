{
  description = "workflow-manager repository";

  inputs = {
      nixpkgs.url = "github:NixOS/nixpkgs";
  };

  outputs = { self, nixpkgs }:
    let
      javaVersion = 22; # Change this value to update the whole stack

      supportedSystems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forEachSupportedSystem = f: nixpkgs.lib.genAttrs supportedSystems (system: f {
        pkgs = import nixpkgs { inherit system; overlays = [ self.overlays.default ]; };
      });
    in
    {
      overlays.default =
        final: prev: {
          jdk = prev."jdk${toString javaVersion}";
        };

      devShells = forEachSupportedSystem ({ pkgs }: {
        default = pkgs.mkShell {
          packages = with pkgs; [
            # general
            gcc
            zlib

            # bazel
            bazelisk
            bazel-buildtools

            # java
            jdk

            # javascript
            nodejs
            nodePackages.pnpm
            nodePackages."postcss-cli"
          ];
        };

        env = {
            # bazel needs this env var set https://bazel.build/start/java
            JAVA_HOME = "${pkgs.jdk}/lib/openjdk";
        };
      });
    };
}
