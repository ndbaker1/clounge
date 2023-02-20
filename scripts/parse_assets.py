"""ObjectLoadDescriptor JSON Generator for URL based asset loading

you might run this script using:
bash -c "python <(curl URL_OF_THIS_FILE)"
"""


if __name__ == "__main__":
    print("this scripts generates a JSON for the tablesalt importer.")
    path = input("what is path to the asset folder you want to generate?\n")

    import os
    import json

    descriptors = []

    for group in [d.name for d in os.scandir(path) if d.is_dir()]:
        for group_image in [g for g in os.listdir(os.path.join(path, group)) if not g.startswith(".")]:
            full_path = os.path.join(group, group_image)
            descriptors.append(
                {
                    "frontImg": full_path,
                    "groupLabel": group,
                }
            )

    for image in [
        f.name for f in os.scandir(path) if f.is_file() and not f.name.startswith(".")
    ]:
        descriptors.append(
            {
                "frontImg": image,
            }
        )

    back_image = next((x for x in descriptors if x["frontImg"].startswith("back")), None)

    if back_image is not None:
        descriptors.remove(back_image)
        for descriptor in descriptors:
            descriptor["backImg"] = back_image["frontImg"]

    print("========== saved to descriptors.json ==========")
    print(json.dumps(descriptors, indent=4))
    with open(os.path.join(path, "descriptors.json"), "w+") as descriptors_file:
        json.dump(descriptors, descriptors_file)
