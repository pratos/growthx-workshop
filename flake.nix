{
  description = "Greenhouse dev shell: one environment on every laptop and in every agent sandbox";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  outputs = { self, nixpkgs }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "x86_64-linux" "aarch64-linux" ];
      forAll = f: nixpkgs.lib.genAttrs systems (s: f nixpkgs.legacyPackages.${s});
    in {
      devShells = forAll (pkgs: {
        default = pkgs.mkShell {
          packages = with pkgs; [ bun nodejs_24 just jq curl git uv sops age ];
          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"   # wrangler, oxlint, oxfmt pinned by bun, not by nix
            echo "greenhouse · bun $(bun --version) · just $(just --version | cut -d' ' -f2)"
          '';
        };
      });
    };
}
